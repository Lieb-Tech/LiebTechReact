using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Documents.Client;
using Microsoft.Azure.Documents.Linq;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;

namespace LiebTechReact.Controllers
{
    [Route("api/[controller]")]
    public class WordsController : Controller
    {

        class nersWrapper
        {
            public string id;
            public string partionKey;
            public List<ner> words;
        }
        class ners
        {
            public List<ner> words;
        }
        class ner
        {
            public string word;
            public List<nerWord> data;
        }
        class nerWord
        {
            public string Added;
            public string Id;
            public string Feed;
        }

        public class lemmaRet
        {
            public long dt;
            public List<lemmaVal> vals = new List<lemmaVal>();
        }
        public class lemmaVal
        {
            public string word;
            public int count;
        }

        // Trump'
        [Route("search/{val}")]
        [HttpGet]
        public ActionResult GetSearch(string val)
        {
            Stopwatch sw = new Stopwatch();
            sw.Start();
            var qry = Program.cdb.GetDocumentQuery("system",
                    $"select top 10 value w from c join w in c.words join d in w.data where contains(c.id, 'NER:') and Lower(w.word)= '{val.ToLower()}' ORDER BY c._ts");
            var results = qry.ToList();

            var ret = new List<ner>();
            foreach (var r in results)
            {
                ret.Add(Newtonsoft.Json.JsonConvert.DeserializeObject<ner>(r.ToString()));
            }

            var ids = ret.SelectMany(a => a.data.Select(s => s.Id)).ToList();
            var urls = string.Join(",", ids.Select(a => $"'{a}'"));

            var qry2 = Program.cdb.GetDocumentQuery("newsfeed", "select c.link, c.title, c.description, c.pubDate, c.partionKey from c where c.id in (" + urls + ")");
            var res = qry2
                .ToList();

            var results2 = res.Select(a => JsonConvert.DeserializeObject <NewsItem>( a.ToString()))
                .OrderByDescending(o => o.pubDate)
                .ToList();
            sw.Stop();
            return Ok(new { milli = sw.ElapsedMilliseconds, vals = results2 });
        }

        public class lemmaRequest
        {
            public int minPer;
            public int numSeg;
            public int minCount;
        }

        [Route("lemma")]
        [HttpPost]
        public ActionResult GetLemma([FromBody]lemmaRequest req)
        {
            // pubDate is indexed, but a string
            // _ts is epoch, so no conversions needed
            var recent = Program.cdb.GetDocumentQuery<NewsItem>("newsfeed")
                        .OrderByDescending(z => z.pubDate)
                            .Select(z => z._ts)
                            .Take(1)
                            .ToList();

            var start = DateTimeOffset.FromUnixTimeSeconds((long)recent.First());

            var ret = new List<lemmaRet>();
            for (int segment = req.numSeg; segment > -1; segment--)
            {
                var o = new lemmaRet();
                var dts = new List<string>();
                for (var minute = 0; minute < req.minPer; minute++)
                {
                    var interval = minute + (segment * req.minPer);
                    interval *= -1;
                    if (minute == 0)
                        o.dt = start.AddMinutes(interval).ToUnixTimeMilliseconds();

                    dts.Add(start.AddMinutes(interval).ToString("yyyy-MM-dd-hh-mm"));
                }

                var qry = Program.cdb.GetDocumentQuery<nersWrapper>("system")
                    .Where(z => dts.Contains(z.id))
                    .Select(z => z.words);
                
                var results = qry.ToList();

                if (results.Any())
                {
                    foreach (var result in results.SelectMany(z => z))
                    {
                        if (o.vals.Any(z => z.word == result.word))
                            o.vals.First(z => z.word == result.word).count += result.data.Count();
                        else
                            o.vals.Add(new lemmaVal()
                            {
                                word = result.word,
                                count = result.data.Count()
                            });
                    }

                    o.vals = o.vals.Where(z => z.count >= req.minCount).OrderByDescending(z => z.count).ToList();
                }         
                if (o.vals.Count > 1)
                    ret.Add(o);
            }

            return Ok(ret.OrderByDescending(z => z.dt));
        }

        public class nerOptions
        {
            public string minPer { get; set; }
            public string numSeg { get; set; }
        }
        [Route("NER")]
        [HttpPost]
        public ActionResult PostNER([FromBody]nerOptions opts)
        {
            Stopwatch sw = new Stopwatch();
            sw.Start();
            
            // pubDate is indexed, but a string
            // _ts is epoch, so no conversions needed
            var recent = Program.cdb.GetDocumentQuery<NewsItem>("newsfeed")
                .OrderByDescending(z => z.pubDate)
                    .Select(z => z._ts)
                    .Take(1)
                    .ToList();

            var start = DateTimeOffset.FromUnixTimeSeconds((long)recent.First());

            var ret = new List<lemmaRet>();
            for (int segment = int.Parse(opts.numSeg ?? "10"); segment > -1; segment--)
            {
                var o = new lemmaRet();
                var dts = new List<string>();
                for (var minute = 0; minute < int.Parse(opts.minPer ?? "10"); minute++)
                {
                    var interval = minute + (segment * int.Parse(opts.minPer ?? "10"));
                    interval *= -1;
                    if (minute == 0)
                        o.dt = start.AddMinutes(interval).ToUnixTimeMilliseconds();

                    dts.Add("NER:" + start.AddMinutes(interval).ToString("yyyy-MM-dd-hh-mm"));
                }

                var qry = Program.cdb.GetDocumentQuery<nersWrapper>("system")
                    .Where(z => dts.Contains(z.id))
                    .Select(z => z.words);

                var results = qry.ToList();

                if (results.Any())
                {
                    foreach (var result in results.SelectMany(z => z))
                    {
                        if (o.vals.Any(z => z.word == result.word))
                            o.vals.First(z => z.word == result.word).count += result.data.Count();
                        else
                            o.vals.Add(new lemmaVal()
                            {
                                word = result.word,
                                count = result.data.Count()
                            });
                    }
                    o.vals = o.vals.OrderByDescending(z => z.count).ToList();
                }
                ret.Add(o);
            }
            sw.Stop();
            return Ok(new { milli = sw.ElapsedMilliseconds, vals = ret.OrderByDescending(z => z.dt) });
        }

        [Route("articles/{amt}")]
        [HttpGet]
        public ActionResult GetArticles(int amt = 25)
        {
            var qry = Program.cdb.GetDocumentQuery<NewsItem>("newsfeed")
                .OrderByDescending(z => z._ts)
                .Take(amt)
                .ToList();

            return Ok(qry);
        }


        [Route("Counts")]
        [HttpGet]
        public ActionResult GetCounts()
        {            
            var vals = Program.cdb.GetDocumentQuery("newsfeed", "select value count(1) from c")
                .ToList();

            return Ok(new { count = vals.First().ToString() });
        }
    }

    public class NewsItem
    {
        public string pubDate { get;  set; }
        public string title { get; set; }
        public string partionKey { get; set; }
        public string description { get; set; }
        public string link { get; set; }
        public long _ts { get; set; }
    }
}
