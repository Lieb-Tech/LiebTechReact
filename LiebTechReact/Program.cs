using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Azure.Documents.Client;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace LiebTechReact
{
    public class Program
    {
        internal static CosmosDB cdb = new CosmosDB();
        public static void Main(string[] args)
        {
            cdb.Open();
            CreateWebHostBuilder(args).Build().Run();        
        }

        public static IWebHostBuilder CreateWebHostBuilder(string[] args) =>
            WebHost.CreateDefaultBuilder(args)
                .UseStartup<Startup>();
    }

    public class CosmosSetting
    {
        public CosmosDB Cosmos { get; set; }
        public class CosmosDB
        {
            public string EndpointUrl { get; set; }
            public string PrimaryKey { get; set; }
        }
    }

    public class CosmosDB
    {        
        public DocumentClient client;

        // ADD THIS PART TO YOUR CODE
        public CosmosDB()
        {
            /*
            "Cosmos": {
                "EndpointUrl": "https://datafeeds.documents.azure.com:443/",
                 "PrimaryKey": "DTMyirMGmVjxZqnjKefDNpXD6rybf7JRVM1kfT6VNFvzb4WbDojZZ1ICrgv6ionl4fVe5XWFx642kwWZs4AIZw=="
            }
            */
            var data = File.ReadAllText("cosmosDbKey.json");
            var config = JsonConvert.DeserializeObject<CosmosSetting>(data);

            this.client = new DocumentClient(new Uri(config.Cosmos.EndpointUrl), config.Cosmos.PrimaryKey, new ConnectionPolicy
            {
                ConnectionMode = ConnectionMode.Direct,
                ConnectionProtocol = Protocol.Tcp
            });
        }

        public void Open()
        {
            client.OpenAsync().Wait();
        }

        public IQueryable<T> GetDocumentQuery<T>(string collection, int maxItems = 100)
        {
            FeedOptions queryOptions = new FeedOptions { MaxItemCount = maxItems, EnableCrossPartitionQuery = true };
            return client.CreateDocumentQuery<T>(this.GetCollectionLink(collection), queryOptions);
        }

        public IQueryable<T> GetDocumentQuery<T>(string collection, FeedOptions options)
        {
            return client.CreateDocumentQuery<T>(this.GetCollectionLink(collection), options);
        }

        public IQueryable<dynamic> GetDocumentQuery(string collection, string query, int maxItems = 100)
        {
            FeedOptions queryOptions = new FeedOptions { MaxItemCount = maxItems, EnableCrossPartitionQuery = true };
            return client.CreateDocumentQuery<dynamic>(
                GetCollectionLink(collection),
                query,
                queryOptions);
        }

        public Uri GetCollectionLink(string collectionName)
        {
            return UriFactory.CreateDocumentCollectionUri("liebfeeds", collectionName);
        }

    }
}