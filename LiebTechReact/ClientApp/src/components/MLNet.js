import React, { Component } from 'react';
import './MLNet.css';

export class MLNet extends Component {
    constructor(props) {
        super(props);
        this.state = { init: true, loading: false, count: 25 };

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

    renderPred() {
        let data = this.state.data;
        return (
        <div>
                <ul>
                    <li>Training algorythm used: StochasticDualCoordinateAscent </li>
                    <li>Features used: Title (displayed below) and Description</li>
                    <li>Label: feed source</li>
                    <li>Training records: 15,000 </li>
                    <li>Model generated on desktop application, and imported into prediction engine in ASP.NET WebAPI</li>
                </ul>
            
                <div>Data below are the last {this.state.count} news items loaded, with prediction against the above model vs actual feed source</div>
            <div>
                <table>
                    <thead>                        
                        <tr>
                            <th>Prediction &nbsp;</th>
                            <th>Actual &nbsp;</th>
                            <th>Title</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(d =>
                            <tr style={{color:d.prediction.section === d.newsItem.partionKey ? 'green' :'red'}} >
                                <td>{d.prediction.section}</td><td>{d.newsItem.partionKey}</td><td>{d.newsItem.title}</td>
                            </tr>                                                                                                     
                    )}
                    </tbody>
                </table>        
                </div>
            </div>
        );
    }       
        
    render() {
        let contents = this.state.init
            ? <p><em>Initializing ML.NET Model </em></p>
            : (this.state.loading
                ? <p><em>Doing predictions and loading data...</em></p>
                : this.renderPred()
            );

        return (
            <div>                
                <h1>ML.Net results</h1>
                {contents}
                <div>&nbsp;</div>
                <div>Code available at the <a rel="noopener noreferrer" target="_blank" href="https://github.com/lieb-tech">Github repo</a></div>
            </div>
        );
    }
}