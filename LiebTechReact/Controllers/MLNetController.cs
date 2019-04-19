using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.ML;
using Microsoft.ML.Data;

namespace LiebTechReact.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MLNetController : ControllerBase
    {
        private static MLContext _mlContext = null;

        private static ITransformer _loadedModel;
        
        private static PredictionEngine<MLNewsItem, SectionPrediction> _predEngineSDCA = null;
        private static PredictionEngine<MLNewsItem, SectionPrediction> _predEngineLR = null;

        private readonly IHostingEnvironment _hostingEnvironment;

        public MLNetController(IHostingEnvironment hostingEnvironment)
        {
            _hostingEnvironment = hostingEnvironment;
        }

        [Route("initModel")]
        [HttpGet]
        public ActionResult GetInitModel()
        {
            try
            {
                string projectRootPath = _hostingEnvironment.ContentRootPath;

                if (_mlContext == null)
                {
                    _mlContext = new MLContext(seed: 0);

                    string _modelPath = projectRootPath + "/Data/feed_model.zip";                    
                    using (var stream = new FileStream(_modelPath, FileMode.Open, FileAccess.Read, FileShare.Read))
                        _loadedModel = _mlContext.Model.Load(stream);
                    _predEngineSDCA = _loadedModel.CreatePredictionEngine<MLNewsItem, SectionPrediction>(_mlContext);

                    _modelPath = projectRootPath + "/Data/LR_feed_model.zip";
                    using (var stream = new FileStream(_modelPath, FileMode.Open, FileAccess.Read, FileShare.Read))
                        _loadedModel = _mlContext.Model.Load(stream);                    
                    _predEngineLR = _loadedModel.CreatePredictionEngine<MLNewsItem, SectionPrediction>(_mlContext);
                }

                return Ok(new { loadedOk = true });
            }
            catch (Exception ex)
            {
                _mlContext = null;
                return BadRequest(new { ex.Message });
            }
        }        

        [Route("recentml/{count}")]
        [HttpGet]
        public ActionResult GetRecentML(int count)
        {
            if (_mlContext == null)
                return BadRequest(new { modelFailed = true });

            var qry = Program.cdb.GetDocumentQuery<NewsItem>("newsfeed")
                .OrderByDescending(z => z._ts)
                .Take(count)
                .ToList();

            var results = new List<dynamic>();

            foreach (var n in qry)
            {        
                MLNewsItem singleIssue = new MLNewsItem()
                {
                    Title = n.title,
                    Description = n.description
                };



                results.Add(new
                {
                    sdca = _predEngineSDCA.Predict(singleIssue),
                    lr = _predEngineLR.Predict(singleIssue),
                    newsItem = n
                });
            }

            return Ok(new { preds = results});
        }
    }

    public class MLNewsItem
    {
        [LoadColumn(0)]
        public string ID { get; set; }
        [LoadColumn(1)]
        public string Feed { get; set; }
        [LoadColumn(2)]
        public string SiteSection { get; set; }
        [LoadColumn(3)]
        public string Title { get; set; }
        [LoadColumn(4)]
        public string Description { get; set; }
    }

    public class SectionPrediction
    {
        [ColumnName("PredictedLabel")]
        public string Section;
    }

}