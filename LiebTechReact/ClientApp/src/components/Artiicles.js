import React, { Component } from 'react';
import moment from 'moment-timezone';

export class Articles extends Component {

    constructor(props) {
        super(props);
        this.state = { words: [], loading: true, hasSelected: false, count: 'Counting ... ', numSeg: 20, minPer: 5 };

        let qry = {
            minPer: this.state.minPer.toString(),
            numSeg: this.state.numSeg.toString(),
        }

        fetch('api/Words/articles/25')
            .then(response => response.json())
            .then(data => {
                data.map(d => {
                    d.date = moment(d.dt).format("MM/DD hh:mm");
                });
                this.setState({ words: data, loading: false, hasSelected: false });
            });

        fetch('api/Words/counts')
            .then(response => response.json())
            .then(data => {
                this.setState({ count: data.count });
            });
    }

    selectInfo(info, e) {
        this.setState({ isSelecting: true });
        fetch('api/words/search/' + info)
            .then(response => response.json())
            .then(data => {
                this.setState({ selected: { val: info, data: data.vals }, hasSelected: true, selectedMilli: data.milli });
            });
    }

    renderArticles(data) {
        return (
            <div>
            {data.map(d =>
                    <div>
                        <div>
                        <span>{d.date}</span> - 
                        <span>{d.title}</span>
                        </div>
                        <span>{d.description}</span>           
                        <hr width="100%" style={{ height: '2px;' }} ></hr>            
                </div> 
             )}
            </div>
        );
    }

    render() {
        let contents = this.state.loading
            ? <p><em>Loading...</em></p>
            : this.renderArticles(this.state.words, this.state.milli);

        return (
            <div>
                Documents: {this.state.count}
                <h1>Recently loaded articles</h1>                
                {contents}
            </div>
        );
    }
}
