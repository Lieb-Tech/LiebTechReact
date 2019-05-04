using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.ML;
using Microsoft.ML.Data;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace LiebTechReact.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MLNetController : ControllerBase
    {
        private static MLContext _mlContext = null;
        private static string modelSize = "0";
        private static ITransformer _loadedModel;        
        private static PredictionEngine<MLNewsItem, SectionPrediction> _predEngineSDCA = null;
        private static PredictionEngine<MLNewsItem, SectionPrediction> _predEngineLR = null;
        private static PredictionEngine<MLNewsItem, SectionPrediction> _predEngineNC = null;

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
                // if model is not loaded yet, then 
                if (_mlContext == null)
                {
                    _mlContext = new MLContext(seed: 0);

                    // get the models in the data folder
                    DirectoryInfo di = new DirectoryInfo(projectRootPath + "/Data/");

                    var reg = "model_SD\\d{1,2}.zip";
                    var files = di.GetFiles("model_SD*.zip").OrderByDescending(z => z.CreationTime).ToList();
                    foreach (var f in files)
                    {
                        if (Regex.Match(f.FullName, reg).Success)
                        {
                            using (var stream = new FileStream(f.FullName, FileMode.Open, FileAccess.Read, FileShare.Read))
                                _loadedModel = _mlContext.Model.Load(stream, out var modelInputSchema);
                                
                            _predEngineSDCA = _mlContext.Model.CreatePredictionEngine<MLNewsItem, SectionPrediction>(_loadedModel);

                            modelSize = f.Name.Substring(8, f.Name.IndexOf(".") -8);
                            break;
                        }
                    }

                    reg = "model_LB\\d{1,2}.zip";
                    files = di.GetFiles("model_LB*.zip").OrderByDescending(z => z.CreationTime).ToList();
                    foreach (var f in files)
                    {
                        if (Regex.Match(f.FullName, reg).Success)
                        {
                            using (var stream = new FileStream(f.FullName, FileMode.Open, FileAccess.Read, FileShare.Read))
                                _loadedModel = _mlContext.Model.Load(stream, out var modelInputSchema);
                            _predEngineLR = _mlContext.Model.CreatePredictionEngine<MLNewsItem, SectionPrediction>(_loadedModel);
                            break;
                        }
                    }

                    reg = "model_NC\\d{1,2}.zip";
                    files = di.GetFiles("model_NC*.zip").OrderByDescending(z => z.CreationTime).ToList();
                    foreach (var f in files)
                    {
                        if (Regex.Match(f.FullName, reg).Success)
                        {
                            using (var stream = new FileStream(f.FullName, FileMode.Open, FileAccess.Read, FileShare.Read))
                                _loadedModel = _mlContext.Model.Load(stream, out var modelInputSchema);
                            _predEngineNC = _mlContext.Model.CreatePredictionEngine<MLNewsItem, SectionPrediction>(_loadedModel);
                            break;
                        }
                    }
                }

                return Ok(new { loadedOk = true, size = modelSize });
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
                    nc = _predEngineNC.Predict(singleIssue),
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