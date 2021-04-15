Hooks.once('init', () => {
  console.log('fleeting-luck | Initializing...')

  window.fleetingLuck = {
    dashboard: new LuckDashboard(),
    datamanager: new LuckDataManager()
  }

  window.fleetingLuck.datamanager.register();

  console.log('fleeting-luck | Initialization Complete.')
});

Hooks.once('ready', () => {
  if (window.fleetingLuck.datamanager.characters().characters.length === 0) {
    console.log(game.actors.entities);
    const actors = game.actors.entities.filter(a => a.data.type === "character" || a.data.type === "Player");
    const pcs = actors.filter(a => a.hasPlayerOwner);
    for (let i = 0; i < pcs.length; i++) {
      window.fleetingLuck.datamanager.addCharacter(pcs[i].data);
    }
  } 

});

Hooks.on('renderActorDirectory', (app, html, data) => {
  html
    .find(".directory-header")
    .prepend(`<div class="action-buttons flexrow"><button id="btn-dashboard"><i class="fas fa-dice"> </i>Fleeting Luck</div>`)
    .promise()
    .done(() => {
      $('#btn-dashboard').on('click', e => {
        window.fleetingLuck.dashboard.redraw(true);
      });
    })
});

class LuckDashboard extends Application {

  static get defaultOptions() {

    let dd = [];
    dd.push(
    new DragDrop({ 
      dropSelector: ".drop-target",
      callbacks: { 
          drop: this.handleDrop
      }}));

    return mergeObject(super.defaultOptions, {
      id: "fleeting-luck-dashboard",
      classes: ["luck-dashboard"],
      template: "modules/fleeting-luck/templates/luck_dashboard.html",
      minimizable: true,
      resizable: true,
      title: "Fleeting Luck",
      dragDrop: dd,
    })
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('.clear-all-luck').click(ev => {
      console.log('fleeting-luck | Removing all luck...')
        window.fleetingLuck.datamanager.removeAllLuck();
        console.log('fleeting-luck | Removing all luck complete.')
        this.render(true);
    });

    html.find('.luck-form-add-btn').click(ev => {
      console.log('fleeting-luck | Adding luck...')
      let actorName = ev.target.attributes['data-entity-id'].value;
        console.log('fleeting-luck | Adding luck to ' + actorName + "...");
        window.fleetingLuck.datamanager.addLuck(actorName, 1);
        console.log('fleeting-luck | Adding luck complete.')
        this.render(true);
    });

    html.find('.luck-form-sub-btn').click(ev => {
      console.log('fleeting-luck | Subtracting luck...')
        let actorName = ev.target.attributes['data-entity-id'].value;
        console.log('fleeting-luck | Subtracting luck from ' + actorName + "...");
        window.fleetingLuck.datamanager.addLuck(actorName, -1);
        console.log('fleeting-luck | Subtracting luck complete.')
        this.render(true);
    });

  }

  _onDragStart(event) {
    console.log(event);
    if (event.currentTarget.dataset.itemId !== undefined) {
      super._onDragStart(event);
      return;
    }

    let entityId = event.currentTarget.dataset.entityId;
    event.dataTransfer.setData(
      "text/plain",
      JSON.stringify({
        type: "Actor",
        action: "assign",
        id: entityId,
      })
    );
  }

  async handleDrop(event) {
    console.log(event);
    let draggedItem = JSON.parse(event.dataTransfer.getData("text/plain"));
    console.log(draggedItem);
  }

  redraw(force) {
    this.render(force);
  }

  getData() {
    return window.fleetingLuck.datamanager.characters();
  }

}

class LuckDataManager {

  characters() {
    let retVal = this.get();
    return retVal;
  }

  clearCharacters() {
    let newData = { characters: [] };
    this.set(newData);
  }

  addCharacter(actor) {
    console.log('fleeting-luck | adding character: ' + actor.name );
    let data = this.get();
    data.characters.push({ actor: actor, luck: 1, burn: this.buildBurn(1) });
    console.log(data);
    this.set(data);
  }

  buildBurn(luck) {
    let brn = [];
    for (let i = 0; i < luck; i++) {
      brn.push({ "cnt": i });
    }
    return brn;
  }

  addLuck(name, valueToAdd) {
    let data = this.get();
    for (let i = 0; i < data.characters.length; i++) {
      if (data.characters[i].actor.name == name) {
        let newLuckValue = data.characters[i].luck + valueToAdd;
        data.characters[i].luck = data.characters[i].luck + valueToAdd;
        data.characters[i].burn = this.buildBurn(data.characters[i].luck);
        if (data.characters[i].luck < 0) {
          data.characters[i].luck = 0;
          data.characters[i].burn = [];
        }    
      }
    }
    this.set(data);
  }

  updateCharacter(name, luck) {
    let data = this.get();
    for (let i = 0; i < data.characters.length; i++) {
      if (data.characters[i].actor.name == name) {
        data.characters[i].luck = luck;
        data.characters[i].burn = this.buildBurn(data.characters[i].luck);
      }
    }
    this.set(data);
  }

  removeAllLuck() {
    let data = this.get();
    for (let i = 0; i < data.characters.length; i++) {
      data.characters[i].luck = 0;
      data.characters[i].burn = [];
    }
    this.set(data);
  }

  register() {
    let newData = { characters: [] };
    console.log('fleeting-luck | registering settings...')
    game.settings.register('fleeting-luck', 'luck-data', {
      name: "Fleeting Luck Data",
      scope: "client",
      config: false,
      type: Object,
      default: null
    });
    this.set(newData);
    console.log('fleeting-luck | settings registered.')
  }

  get() {
    return game.settings.get('fleeting-luck', 'luck-data');
  }

  set(value) {
    game.settings.set('fleeting-luck', 'luck-data', value)
  }
}
