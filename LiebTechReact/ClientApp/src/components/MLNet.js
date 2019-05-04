import React, { Component } from 'react';

import './MLNet.css';

export class MLNet extends Component {
    
    constructor(props) {
        super(props);
        this.state = { init: true, loading: false, count: 50, showCode: false, modelSize: '35,000' };

        fetch('api/mlnet/initModel')
            .then(response => response.json())
            .then(data => {
                this.setState({ init: false, loading: true, modelSize: data.size });

                fetch('api/mlnet/recentml/' + this.state.count)
                    .then(response => response.json())
                    .then(data => {
                        this.setState({ data: data.preds, loading: false });
                    });
            });
    }

    viewStats(e) {
        this.setState({ 'showStats': true });
        e.preventDefault();
    }
    closeStats(e) {
        this.setState({ 'showStats': false });
        e.preventDefault();
    }

    statoverCode() {
        return (
            <div style={{ padding: "5px", left: "15px", top: "15px", backgroundColor: "silver", position: "absolute", height: "700px", width: "825px", zIndex: "5" }}>
                <div style={{ position: "absolute", right: "10px" }}><a href="" onClick={(e) => this.closeStats(e)}>Close</a></div>
                <h2>Differnce in accuracy in training set sizes</h2>
                <h4>Logistical Regression</h4>
                <div>
                    <p>&nbsp;5,000 = 71.0 %</p>
                    <p>10,000 = 71.9 % accuracy</p>
                    <p>15,000 = 71.4 % accuracy</p>
                    <p>20,000 = 71.9 % accuracy</p>
                    <p>25,000 = 73.2 % accuracy</p>
                    <p>30,000 = 74.8 % accuracy</p>
                    <p>35,000 = 74.6 % accuracy</p>
                </div>
                <h4>SDCA</h4>
                <div>
                    <p>&nbsp;5,000 = 74.2 % accuracy</p>
                    <p>10,000 = 72.9 % accuracy</p>
                    <p>15,000 = 70.5 % accuracy</p>
                    <p>20,000 = 70.6 % accuracy</p>
                    <p>25,000 = 70.2 % accuracy</p>
                    <p>30,000 = 72.0 % accuracy</p>
                    <p>35,000 = 70.8 % accuracy</p>
                </div>
                <p></p>
                <p></p>
                <div>Note: 1,000 records were processed against the above models,</div>
                <div>noting how many predictions matched the actual source</div>                
            </div>
        );       
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
        let s = 0, n = 0, l = 0, v = 0;
        data.map(d => {
            if (d.sdca.section === d.newsItem.partionKey) s++;            
            if (d.lr.section === d.newsItem.partionKey) l++;
            if (d.nc.section === d.newsItem.partionKey) n++;
            d.v = (d.sdca.section === d.newsItem.partionKey ? 1 : 0) +
                (d.lr.section === d.newsItem.partionKey ? 1 : 0) +
                (d.nc.section === d.newsItem.partionKey ? 1 : 0);

            if (d.v === 0)
                d.color = 'red';
            else if (d.v === 1)
                d.color = 'orange';
            else if (d.v === 2)
                d.color = 'blue';
            else if (d.v === 3)
                d.color = 'green';
        });
        s = ((s / this.state.count) * 100).toFixed(1);
        l = ((l / this.state.count) * 100).toFixed(1);
        n = ((n / this.state.count) * 100).toFixed(1);
        return (
        <div>
                <ul>                    
                    <li>ML.Net framework v1.0 used to generate model</li>
                    <li>Training algorithm used: SdcaMaximumEntropy (SDCA), SdcaNonCalibrated (NC), LbfgsMaximumEntropy (LR)</li>
                    <li>Features used: Title (displayed below) and Description</li>
                    <li>Label: feed source</li>
                    <li>Training records: {this.state.modelSize},000 <a href="" onClick={(e) => this.viewStats(e)}>View stats</a></li>
                    <li>Model imported into prediction engine into site's .NET Core API <a href="" onClick={(e) => this.viewCode(e)}>View code</a></li>
                </ul>
            
                <div>Data below are the last {this.state.count} news items loaded, with prediction against the above model vs actual feed source</div>
                <div><span style={{ bold: 'true', color: 'green' }}>Green</span> means the all models predicted correctly;&nbsp;
                    <span style={{ color: 'blue' }}>Blue</span> means 2 models were correct;&nbsp;
                    <span style={{ color: 'orange' }}>Orange</span> means that 1 got it right;&nbsp;
                    <span style={{ color: 'red' }}>Red</span> means all models were wrong</div>
            <div>
                <table>
                    <thead>                        
                        <tr>
                            <th><div>SDCA</div>({s}%)</th>                                                            
                            <th><div>NC</div>({l}%)</th>
                            <th><div>LR</div>({l}%)</th>
                            <th>Actual &nbsp;</th>
                            <th>Title</th>
                        </tr>
                    </thead>
                        <tbody>                            
                            {data.map(d =>                                
                                <tr>
                                    <td style={{ color: d.sdca.section === d.newsItem.partionKey ? 'green' : 'red' }}>{d.sdca.section}</td>
                                    <td style={{ color: d.nc.section === d.newsItem.partionKey ? 'green' : 'red' }}>{d.nc.section}</td>
                                    <td style={{ color: d.lr.section === d.newsItem.partionKey ? 'green' : 'red' }}>{d.lr.section}</td>                                    
                                    <td>{d.newsItem.partionKey}</td>
                                    <td style={{color: d.color}}>{d.newsItem.title}</td>
                                </tr>                            
                        )}
                    </tbody>
                </table>        
                </div>
            </div>
        );
    }           

    render() {
        let statover = this.state.showStats
            ? this.statoverCode()
            : "";

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
                //<!-- <a href="" onClick={(e) => this.viewStats(e)}>View Stats</a> -->
        return (
            <div>                
                <h1>ML.Net results</h1>
                {statover}
                {popover}
                {contents}
                <div>&nbsp;</div>
                <div>Code available at the <a rel="noopener noreferrer" target="_blank" href="https://github.com/lieb-tech">Github repo</a></div>
            </div>
        );
    }
}