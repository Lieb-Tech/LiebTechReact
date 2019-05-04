import React, { Component } from 'react';
import moment from 'moment-timezone';

export class NER extends Component {

    constructor(props) {
        super(props);
        this.state = { words: [], loading: true, hasSelected: false, count: 'Counting ... ', numSeg: 20, minPer: 5, minResult: 1 };
        this.loadData();
        this.reloadData = this.reloadData.bind(this);
    }

    loadData() {
        let qry = {
            minPer: this.state.minPer.toString(),
            numSeg: this.state.numSeg.toString(),
            minResult: this.state.minResult.toString()
        }

        fetch('api/Words/ner', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(qry)  
        })
        .then(response => response.json())
        .then(data => {
            data.vals.map(d => {
                d.date = moment(d.dt).format("MM/DD hh:mm");
            });
            this.setState({ milli: data.milli, words: data.vals, loading: false, hasSelected: false });
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

    closeInfo() {
        this.setState({ hasSelected: false, isSelecting : false });
    }

    renderDetails(data) {
        return (
            <div>                
                <div>
                    <a onClick={(e) => this.closeInfo()}>Close</a>&nbsp;- 
                {data.val}  ({this.state.selectedMilli / 1000} sec to load)
            </div>
                <ul>
                    {data.data.map(d => 
                        <li>{d.partionKey} - {d.title} ({d.pubDate})<p>{d.description} <a href={d.link} target="_blank">{d.link}</a></p></li>
                    )}
            </ul>
        </div>
        );
    }

    renderNER(data, milli) {
        return (
            <div>
                ({milli / 1000} sec to load)
            {data.map(d =>
                    <div key={d.dt}>
                        {d.date} -
                    {d.vals.map((w, i) =>
                            <span key={i}>                                
                                <a style={{ textDecoration: 'underline', cursor: 'pointer', color: 'blue' }} onClick={(e) => this.selectInfo(w.word, e)}>{w.word}</a> ({w.count})                                                        
                                {((i + 1)!== d.vals.length) ? <span> || </span> : <span></span>}
                            </span>
                        )}
                        <hr width="100%" style={{ height: '2px' }} ></hr>
                    </div>
                )}
            </div>
        );
    }                        

    inputChangedHandler(event, type) {
        if (type === '1')
            this.setState({ 'minPer': event.target.value });
        else if (type === '2')
            this.setState({ 'numSeg': event.target.value });
        else if (type === '3')
            this.setState({ 'minResult': event.target.value });
        
        event.preventDefault();
    }

    reloadData(event) {
        this.closeInfo();
        this.setState({ loading: true });
        this.loadData();        
        event.preventDefault();        
    }

    render() {
        let contents = this.state.loading
            ? <p><em>Loading...</em></p>
            : this.renderNER(this.state.words, this.state.milli);

        let details = this.state.hasSelected
            ? this.renderDetails(this.state.selected)
            : (this.state.isSelecting ? <p>Loading</p> : <span></span>);

        let search =
            (<div>
                <form onSubmit={this.reloadData}>
                    <label>Minutes per segment:</label> <input type='text' style={{ width: '50px' }} value={this.state.minPer} onChange={(event) => this.inputChangedHandler(event, '1')} /> - &nbsp;
                    <label>Number of segments:</label> <input type='text' style={{ width: '50px' }} value={this.state.numSeg} onChange={(event) => this.inputChangedHandler(event, '2')} />  &nbsp;                 
                    <label>Minimim count:</label> <input type='text' style={{ width: '50px' }} value={this.state.minResult} onChange={(event) => this.inputChangedHandler(event, '3')} />  &nbsp;                 
                <input type="submit" value="Load data" />
                </form>
            </div>);
        
        return (
            <div>
                Documents: {this.state.count}
                <h1>Recent Named Entity Recognition</h1>
                {search}
                {details}
                {contents}                
            </div>
        );
    }
}
