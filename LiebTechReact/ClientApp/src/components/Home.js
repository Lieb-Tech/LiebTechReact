import React, { Component } from 'react';

export class Home extends Component {
    static displayName = Home.name;

    render() {
        return (
            <div> Welcome to Lieb-Tech's React sandbox.
            <p>
                    <h3>Project overview</h3>
                    <ul>
                        <li>RSS new feed data downloaded, parsed, processed and loaded by a .NET Core 2.2 application</li>
                        <li>Raspberry Pi is running the .NET Core application, on Raspian distro</li>
                        <li>Data is stored in Azure CosmosDB, using the SQL API</li>
                        <li>.NET 4.7 Framework application to do the NLP processing, utilizing the StanfordNLP project.</li>
                        <li>Akka.Net cluster connects the application together</li>                        
                    </ul>
                </p>
                <p>
                    <div>This web page was a way for me to start learning the React (jsx) framework. There's also a corresponding Angular project page</div>
                    <div>avaiable here: <a rel="noopener noreferrer" target="_blank" href="https://liebtechng.azurewebsites.net">https://liebtechng.azurewebsites.net</a></div>
                </p>
                <p style={{ paddingTop: "5px", marginTop: "5px" }}>
                    <ul>
                        <li>The ML.Net link is a display of results of predictions using the multiclass classification using trainer</li>
                        <li>The NER link is using Stanford's NLP package to do Named Entity Recogniztion in text.</li>
                        <li>The Lemma link is using Stanford's NLP package to extract word bases from text.</li>
                        <li>The Articles link shows the most recent articles loaded in the system.</li>
                    </ul>
                </p>
                <p style={{ paddingTop: "5px", marginTop: "5px" }}>
                    <div>This is a list of the news feeds being processed</div>
                </p>
                <p >
                    <ul>
                        <li>ABC</li>
                        <li>BBC</li>
                        <li>CBS</li>
                        <li>CNN</li>
                        <li>DailyMail</li>
                        <li>FoxNews</li>
                        <li>Huffington Post</li>
                        <li>NBC</li>
                        <li>NewsWeek</li>
                        <li>Reuters</li>
                        <li>USAToday</li>
                    </ul>
                </p>

            </div>
        );
    }
}
