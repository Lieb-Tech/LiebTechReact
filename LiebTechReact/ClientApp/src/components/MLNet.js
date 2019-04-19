import React, { Component } from 'react';

import './MLNet.css';

export class MLNet extends Component {
    

    constructor(props) {
        super(props);
        this.state = { init: true, loading: false, count: 50, showCode: false };

        fetch('api/mlnet/initModel')
            .then(data => {
                this.setState({ init: false, loading: true });

                fetch('api/mlnet/recentml/' + this.state.count)
                    .then(response => response.json())
                    .then(data => {
                        this.setState({ data: data.preds, loading: false });
                    });
            });
    }

    viewCode(e) {        
        this.setState({ 'showCode': true });
        e.preventDefault();
    }
    closeCode(e) {
        this.setState({ 'showCode': false });
        e.preventDefault();
    }

    popoverCode() {

        let modelLoad = 'string _modelPath = projectRootPath + "/Data/feed_model.zip"; \r\n' +
            '_mlContext = new MLContext(seed: 0); \r\n' +
            'using (var stream = new FileStream(_modelPathSCDA, FileMode.Open, FileAccess.Read, FileShare.Read))  \r\n' +
            '\tloadedModel = _mlContext.Model.Load(stream);  \r\n\r\n' +
            'using (var stream = new FileStream(_modelPathLR, FileMode.Open, FileAccess.Read, FileShare.Read))  \r\n' +
            '\tloadedModel = _mlContext.Model.Load(stream);  \r\n' +
            '_predEngineLR = loadedModel.CreatePredictionEngine<MLNewsItem, SectionPrediction>(_mlContext); '

        let qryCode = 'var qry = Program.cdb.GetDocumentQuery<NewsItem>("newsfeed")\r\n ' +
            '\t\t.OrderByDescending(z => z._ts).Take(count).ToList();\r\n ' +
            'var results = new List<dynamic>(); \r\n';

        let predictionCode = 'foreach (var n in qry) \r\n' +
            '{  \r\n' +
            '\tMLNewsItem singleIssue = new MLNewsItem() \r\n' +
            '\t{ \r\n' +
            '\t\tTitle = n.title,  \r\n' +
            '\t\tDescription = n.description \r\n' +
            '\t}; \r\n' +
            '\tresults.Add(new \r\n' +
            '\t{ \r\n' +
            '\t\tscda = _predEngineSCDA.Predict(singleIssue), \r\n' +
            '\t\tlr = _predEngineLR.Predict(singleIssue), \r\n' +
            '\t\tnewsItem = n \r\n' +
            '\t}); \r\n' +
            '}';
        
        return (
            <div style={{ padding: "5px", left: "15px", top: "15px", backgroundColor: "silver", position: "absolute", height: "700px", width: "825px", zIndex: "5" }}>
                <div style={{ position: "absolute", right: "10px" }}><a href="" onClick={(e) => this.closeCode(e)}>Close</a></div>
                <h2>Code snippets</h2>
                <h4>Load the model</h4>
                <div >
                    <pre>{modelLoad}</pre>
                </div>
                <h4>Do predictions</h4>
                <div>
                    <pre>{qryCode}
                        {predictionCode}</pre>
                </div>
            </div>
       );       
    }

    renderPred() {        
        let data = this.state.data;
        let s = 0, n = 0, l = 0;
        data.map(d => {
            if (d.sdca.section === d.newsItem.partionKey) s++;            
            if (d.lr.section === d.newsItem.partionKey) l++;
        });
        s = ((s / this.state.count) * 100).toFixed(1);
        l = ((l / this.state.count) * 100).toFixed(1)
        return (
        <div>
                <ul>                    
                    <li>ML.Net framework v0.11 used to generate model</li>
                    <li>Training algorithm used: StochasticDualCoordinateAscent (SDCA), Logistic Regression (LR)</li>
                    <li>Features used: Title (displayed below) and Description</li>
                    <li>Label: feed source</li>
                    <li>Training records: 15,000 </li>
                    <li>Model imported into prediction engine into site's .NET Core API <a href="" onClick={(e) => this.viewCode(e)}>View code</a></li>
                </ul>
            
                <div>Data below are the last {this.state.count} news items loaded, with prediction against the above model vs actual feed source</div>
                <div>Green means the ML algorithm predicted the source correctly; Red means it got it wrong</div>
            <div>
                <table>
                    <thead>                        
                        <tr>
                                <th><div>SDCA</div>({s}%)</th>                                
                                <th><div>LR</div>({l}%)</th>
                            <th>Actual &nbsp;</th>
                            <th>Title</th>
                        </tr>
                    </thead>
                        <tbody>                            
                            {data.map(d =>                                 
                                <tr >
                                    <td style={{ color: d.sdca.section === d.newsItem.partionKey ? 'green' : 'red' }}>{d.sdca.section}</td>
                                    <td style={{ color: d.lr.section === d.newsItem.partionKey ? 'green' : 'red' }}>{d.lr.section}</td>
                                    <td>{d.newsItem.partionKey}</td>
                                    <td style={{
                                        color: (d.sdca.section === d.newsItem.partionKey ||                                            
                                            d.lr.section === d.newsItem.partionKey)
                                            ? 'green' : 'red'
                                    }}>{d.newsItem.title}</td>
                                </tr>                            
                        )}
                    </tbody>
                </table>        
                </div>
            </div>
        );
    }           

    render() {
        let popover = this.state.showCode
            ? this.popoverCode()
            : "";

        let contents = this.state.init
            ? <div>
                <p><em>Initializing ML.NET Model </em></p>
                <p>This process can take up to 30 seconds. </p>
                <p>C# code being executed: </p>
                <pre>{'string _modelPath = projectRootPath + "/Data/feed_model.zip"; \r\n' +
                    '_mlContext = new MLContext(seed: 0); \r\n' +
                    'using (var stream = new FileStream(_modelPath, FileMode.Open, FileAccess.Read, FileShare.Read))  \r\n' +
                    '   loadedModel = _mlContext.Model.Load(stream);  \r\n' +
                    '\r\n' +
                    '_predEngine = loadedModel.CreatePredictionEngine<MLNewsItem, SectionPrediction>(_mlContext); '}
                </pre>
            </div> 
            : (this.state.loading
                ? <div><p><em>Doing predictions and loading data...</em></p>
                    <p>C# code being executed: </p>
                    <pre>{'foreach (var n in qry) \r\n' +
                        '{  \r\n' +
                        '\tMLNewsItem singleIssue = new MLNewsItem() \r\n' +
                        '\t{ \r\n' +
                        '\t\tTitle = n.title,  \r\n' +
                        '\t\tDescription = n.description \r\n' +
                        '\t}; \r\n' +
                        '\tvar prediction = _predEngine.Predict(singleIssue); \r\n' +
                        '\tresults.Add(new \r\n' +
                        '\t{ \r\n' +
                        '\t\tprediction, \r\n' +
                        '\t\tnewsItem = n \r\n' +
                        '\t}\r\n} \r\n'
                    }
                    </pre>
                </div>
                : this.renderPred());            
        return (
            <div>                
                <h1>ML.Net results</h1>
                {popover}
                {contents}
                <div>&nbsp;</div>
                <div>Code available at the <a rel="noopener noreferrer" target="_blank" href="https://github.com/lieb-tech">Github repo</a></div>
            </div>
        );
    }
}