import React, { Component } from 'react';
import { Route } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { Articles } from './components/Artiicles';
import { Counter } from './components/Counter';
import { NER } from './components/NER';
import { Lemma } from './components/Lemma';
import { MLNet } from './components/MLNet';

export default class App extends Component {
  static displayName = App.name;

  render () {
    return (
      <Layout>
        <Route exact path='/' component={Home} />
            <Route path='/counter' component={Counter} />
            <Route path='/ner' component={NER} />
            <Route path='/lemma' component={Lemma} />
            <Route path='/articles' component={Articles} />
            <Route path='/mlnet' component={MLNet} />
      </Layout>
    );
  }
}
