import React, { Component } from 'react';
import moment from 'moment-timezone';

export class Lemma extends Component {
    static displayName = Lemma.name;

    constructor(props) {
        super(props);
        this.state = { forecasts: [], loading: true, numSeg: 20, minPer: 5, minCount: 1 };
        this.loadData();
        this.reloadData = this.reloadData.bind(this);
    }

    loadData() {
        let qry = {
            minPer: this.state.minPer,
            numSeg: this.state.numSeg,
            minCount: this.state.minCount
        };

        fetch('api/Words/lemma', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(qry)
        })
        .then(response => response.json())
        .then(data => {
            data.map(d => {
                d.date = moment(d.dt).format("MM/DD hh:mm");
            });
            this.setState({ words: data, loading: false });
        });
    }

    renderLemma(data) {
        return (
            <div>
                {data.map(d =>
                    <div key={d.dt}>
                        {d.date} -
                    {d.vals.map(w =>
                            <span>
                                {w.word} ({w.count}) || &nbsp;
                        </span>
                        )}
                        <hr width="100%" style={{ height: '2px' }} ></hr>
                    </div>
                )}
            </div>
        );
    }

    reloadData(event) {       
        this.setState({ loading: true });
        this.loadData();
        event.preventDefault();
    }

    inputChangedHandler(event, type) {
        if (type === 'min')
            this.setState({ 'minPer': event.target.value });
        else if (type === 'num')
            this.setState({ 'numSeg': event.target.value });
        else 
            this.setState({ 'minCount': event.target.value });

        event.preventDefault();
    }

    render() {
        let contents = this.state.loading
            ? <p><em>Loading...</em></p>
            : this.renderLemma(this.state.words);

        let search =
            (<div>
                <form onSubmit={this.reloadData}>
                    <label>Minutes per segment:</label> <input type='text' style={{ width: '25px' }} value={this.state.minPer} onChange={(event) => this.inputChangedHandler(event, 'min')} /> - &nbsp;
                    <label>Number of segments:</label> <input type='text' style={{ width: '25px' }} value={this.state.numSeg} onChange={(event) => this.inputChangedHandler(event, 'num')} /> - &nbsp;
                    <label>Minimum Count:</label> <input type='text' style={{ width: '25px' }} value={this.state.minCount} onChange={(event) => this.inputChangedHandler(event, 'cnt')} />  &nbsp;
                <input type="submit" value="Load data" />
                </form>
            </div>);

        return (
            <div>
                <h1>Recent lemma</h1>
                {search}
                {contents}
            </div>
        );
    }
}
