import React, { Component } from 'react';

import './ImportEpwing.css';

import SecondaryScreen from './SecondaryScreen.js';
import SystemBrowserLink from './SystemBrowserLink.js';
import Button from './Button.js';
import { importEpwing } from '../dictionary';

const { ipcRenderer } = window.require('electron'); // use window to avoid webpack

export default class ImportEpwing extends Component {
  constructor(props) {
    super(props);

    this.state = {
      epwingDirectory: undefined,
      importing: false,
      statusType: 'working',
    };

    ipcRenderer.on('chose-directory', this.handleIpcChoseDirectory);
  }

  componentWillUnmount() {
    ipcRenderer.removeListener('chose-directory', this.handleIpcChoseDirectory);
  }

  handleIpcChoseDirectory = (e, dir) => {
    this.setState({epwingDirectory: dir});
  };

  handleClickChooseDirectory = (e) => {
    e.preventDefault();
    ipcRenderer.send('choose-directory', 'Choose EPWING folder');
  };

  handleImport = async () => {
    this.setState({
      importing: true,
      statusType: 'working',
    });

    try {
      await importEpwing(this.state.epwingDirectory);
      this.props.onReloadDictionaries();
      this.setState({
        importing: false,
        statusType: 'success',
        epwingDirectory: undefined,
      });
    } catch (e) {
      console.log(e.message);
      this.setState({
        importing: false,
        statusType: 'error',
      });
    }
  };

  render() {
    const { onExit } = this.props;

    return (
      <SecondaryScreen title="Import EPWING Dictionary">
        <div>If your EPWING dictionary is archived (e.g. a ZIP or RAR file), first unarchive it. Then choose its root folder, the one that contains the CATALOGS file. Note that Voracious relies on Yomichan Importer to import EPWINGS, and only certain specific dictionaries are supported (<SystemBrowserLink href="https://foosoft.net/projects/yomichan-import/">see the list here</SystemBrowserLink>).</div>
        <br />
        <div>Folder: {this.state.epwingDirectory || <span><i>None selected</i></span>} <button disabled={this.state.importing} onClick={this.handleClickChooseDirectory}>Choose Folder</button></div>
        <br />
        <div className={'ImportEpwing-status ImportEpwing-status-' + this.state.statusType}>&nbsp;</div>
        <br />
        <div>
          <Button disabled={!this.state.epwingDirectory || this.state.importing} onClick={this.handleImport}>Import Selected Folder</Button>&nbsp;
          <Button disabled={this.state.importing} onClick={onExit}>Back</Button>
        </div>
      </SecondaryScreen>
    );
  }
}
