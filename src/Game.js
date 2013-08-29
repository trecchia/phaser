/**
* Phaser.Game
*
* This is where the magic happens. The Game object is the heart of your game,
* providing quick access to common functions and handling the boot process.
*
* "Hell, there are no rules here - we're trying to accomplish something."
*                                                       Thomas A. Edison
*
* @package    Phaser.Game
* @author     Richard Davey <rich@photonstorm.com>
* @copyright  2013 Photon Storm Ltd.
* @license    https://github.com/photonstorm/phaser/blob/master/license.txt  MIT License
*/

Phaser.Game = function (callbackContext, parent, width, height, preloadCallback, createCallback, updateCallback, renderCallback, destroyCallback) {

	if (typeof parent === "undefined") { parent = ''; }
	if (typeof width === "undefined") { width = 800; }
	if (typeof height === "undefined") { height = 600; }
	if (typeof preloadCallback === "undefined") { preloadCallback = null; }
	if (typeof createCallback === "undefined") { createCallback = null; }
	if (typeof updateCallback === "undefined") { updateCallback = null; }
	if (typeof renderCallback === "undefined") { renderCallback = null; }
	if (typeof destroyCallback === "undefined") { destroyCallback = null; }

	this.id = Phaser.GAMES.push(this) - 1;

	this.callbackContext = callbackContext;
	this.onPreloadCallback = preloadCallback;
	this.onCreateCallback = createCallback;
	this.onUpdateCallback = updateCallback;
	this.onRenderCallback = renderCallback;
	this.onDestroyCallback = destroyCallback;

	if (document.readyState === 'complete' || document.readyState === 'interactive')
	{
		setTimeout(Phaser.GAMES[this.id].boot(parent, width, height), 0);
	}
	else
	{
		document.addEventListener('DOMContentLoaded', Phaser.GAMES[this.id].boot(parent, width, height), false);
		window.addEventListener('load', Phaser.GAMES[this.id].boot(parent, width, height), false);
	}

};

Phaser.Game.prototype = {

	/**
	* Phaser Game ID.
	* @type {number}
	*/
	id: 0,

	/**
	* Whether load complete loading or not.
	* @type {bool}
	*/
	_loadComplete: false,

	/**
	* Game is paused?
	* @type {bool}
	*/
	_paused: false,

	/**
	* The state to be switched to in the next frame.
	* @type {State}
	*/
	_pendingState: null,

	/**
	* The current State object (defaults to null)
	* @type {State}
	*/
	state: null,
	
	/**
	* This will be called when init states. (loading assets...)
	* @type {function}
	*/
	onPreloadCallback: null,
	
	/**
	* This will be called when create states. (setup states...)
	* @type {function}
	*/
	onCreateCallback: null,

	/**
	* This will be called when State is updated, this doesn't happen during load (see onLoadUpdateCallback)
	* @type {function}
	*/
	onUpdateCallback: null,

	/**
	* This will be called when the State is rendered, this doesn't happen during load (see onLoadRenderCallback)
	* @type {function}
	*/
	onRenderCallback: null,

	/**
	* This will be called before the State is rendered and before the stage is cleared
	* @type {function}
	*/
	onPreRenderCallback: null,

	/**
	* This will be called when the State is updated but only during the load process
	* @type {function}
	*/
	onLoadUpdateCallback: null,

	/**
	* This will be called when the State is rendered but only during the load process
	* @type {function}
	*/
	onLoadRenderCallback: null,

	/**
	* This will be called when states paused.
	* @type {function}
	*/
	onPausedCallback: null,

	/**
	* This will be called when the state is destroyed (i.e. swapping to a new state)
	* @type {function}
	*/
	onDestroyCallback: null,

	/**
	* Whether the game engine is booted, aka available.
	* @type {bool}
	*/
	isBooted: false,

	/**
	* Is game running or paused?
	* @type {bool}
	*/
	isRunning: false,

	/**
	* Automatically handles the core game loop via requestAnimationFrame or setTimeout
	*/
	raf: null,

    /**
     * Reference to the GameObject Factory.
     * @type {Phaser.GameObjectFactory}
     */
    add: null,

    /**
     * Reference to the assets cache.
     * @type {Phaser.Cache}
     */
    cache: null,

    /**
     * Reference to the input manager
     * @type {Phaser.InputManager}
     */
    input: null,

    /**
     * Reference to the assets loader.
     * @type {Phaser.Loader}
     */
    load: null,

    /**
     * Reference to the math helper.
     * @type {Phaser.GameMath}
     */
    math: null,

    /**
     * Reference to the network class.
     * @type {Phaser.Net}
     */
    net: null,

    /**
     * Reference to the sound manager.
     * @type {Phaser.SoundManager}
     */
    sound: null,

    /**
     * Reference to the stage.
     * @type {Phaser.Stage}
     */
    stage: null,

    /**
     * Reference to game clock.
     * @type {Phaser.TimeManager}
     */
    time: null,

    /**
     * Reference to the tween manager.
     * @type {Phaser.TweenManager}
     */
    tweens: null,

    /**
     * Reference to the world.
     * @type {Phaser.World}
     */
    world: null,

    /**
     * Reference to the physics manager.
     * @type {Phaser.Physics.PhysicsManager}
     */
    physics: null,

    /**
     * Instance of repeatable random data generator helper.
     * @type {Phaser.RandomDataGenerator}
     */
    rnd: null,

    /**
     * Contains device information and capabilities.
     * @type {Phaser.Device}
     */
    device: null,

	/**
	* Initialize engine sub modules and start the game.
	* @param parent {string} ID of parent Dom element.
	* @param width {number} Width of the game screen.
	* @param height {number} Height of the game screen.
	*/
	boot: function (parent, width, height) {

		if (this.isBooted) {
			return;
		}

		if (!document.body) {
			setTimeout(Phaser.GAMES[this.id].boot(parent, width, height), 13);
		}
		else
		{
			document.removeEventListener('DOMContentLoaded', Phaser.GAMES[this.id].boot);
			window.removeEventListener('load', Phaser.GAMES[this.id].boot);

			this.onPause = new Phaser.Signal();
			this.onResume = new Phaser.Signal();

			this.device = new Phaser.Device();
			this.net = new Phaser.Net(this);
			this.math = Phaser.Math;
			// this.stage = new Phaser.Stage(this, parent, width, height);
			// this.world = new Phaser.World(this, width, height);
			// this.add = new Phaser.GameObjectFactory(this);
			this.cache = new Phaser.Cache(this);
			this.load = new Phaser.Loader(this);
			this.time = new Phaser.Time(this);
			this.tweens = new Phaser.TweenManager(this);
			// this.input = new Phaser.InputManager(this);
			// this.sound = new Phaser.SoundManager(this);
			this.rnd = new Phaser.RandomDataGenerator([(Date.now() * Math.random()).toString()]);
			// this.physics = new Phaser.Physics.PhysicsManager(this);
			this.plugins = new Phaser.PluginManager(this, this);
			
			this.load.onLoadComplete.add(this.loadComplete, this);

			// this.setRenderer(Phaser.Types.RENDERER_CANVAS);
			// this.world.boot();
			// this.stage.boot();
			// this.input.boot();

			this.isBooted = true;

            if (this.onPreloadCallback == null && this.onCreateCallback == null && this.onUpdateCallback == null && this.onRenderCallback == null && this._pendingState == null) {
            	console.warn("Phaser update loop cannot start: No preload, create, update or render functions given and no pending State found");
            }
            else
            {
				console.log('Phaser', Phaser.VERSION, 'alive');
    	        this.isRunning = true;
	            this._loadComplete = false;

				this.raf = new Phaser.RequestAnimationFrame(this);
				this.raf.start();

	            if (this._pendingState)
	            {
	                this.switchState(this._pendingState, false, false);
	            }
	            else
	            {
	                this.startState();
	            }
            }

		}

	},

	/**
    * Called when the load has finished after preload was run.
    */
    loadComplete: function () {

        this._loadComplete = true;
        this.onCreateCallback.call(this.callbackContext);

    },

	/**
    * Start the current state
    */
    startState: function () {

        if (this.onPreloadCallback !== null)
        {
            this.load.reset();
            this.onPreloadCallback.call(this.callbackContext);

            //  Is the loader empty?
            if (this.load.queueSize == 0)
            {
                if (this.onCreateCallback !== null)
                {
                    this.onCreateCallback.call(this.callbackContext);
                }

                this._loadComplete = true;

            }
            else
            {
                //  Start the loader going as we have something in the queue
                this.load.onLoadComplete.add(this.loadComplete, this);
                this.load.start();
            }
        }
        else
        {
            //  No init? Then there was nothing to load either
            if (this.onCreateCallback !== null) {
                this.onCreateCallback.call(this.callbackContext);
            }

            this._loadComplete = true;

        }

    },

	/**
    * Set the most common state callbacks (init, create, update, render).
    * @param preloadCallback {function} Init callback invoked when init state.
    * @param createCallback {function} Create callback invoked when create state.
    * @param updateCallback {function} Update callback invoked when update state.
    * @param renderCallback {function} Render callback invoked when render state.
    * @param destroyCallback {function} Destroy callback invoked when state is destroyed.
    */
    setCallbacks: function (preloadCallback, createCallback, updateCallback, renderCallback, destroyCallback) {

        if (typeof preloadCallback === "undefined") { preloadCallback = null; }
        if (typeof createCallback === "undefined") { createCallback = null; }
        if (typeof updateCallback === "undefined") { updateCallback = null; }
        if (typeof renderCallback === "undefined") { renderCallback = null; }
        if (typeof destroyCallback === "undefined") { destroyCallback = null; }

        this.onPreloadCallback = preloadCallback;
        this.onCreateCallback = createCallback;
        this.onUpdateCallback = updateCallback;
        this.onRenderCallback = renderCallback;
        this.onDestroyCallback = destroyCallback;

    },

	update: function (time) {

		this.time.update(time);

        this.plugins.preUpdate();

        this.tweens.update();
        this.input.update();
        this.stage.update();
        this.sound.update();
        this.physics.update();
        this.world.update();

        this.plugins.update();

        if (this._loadComplete)
        {
	        if (this.onUpdateCallback)
	        {
            	this.onUpdateCallback.call(this.callbackContext);
        	}
	
	        this.world.postUpdate();
	        this.plugins.postUpdate();
	        this.plugins.preRender();

	        if (this.onPreRenderCallback)
	        {
	            this.onPreRenderCallback.call(this.callbackContext);
	        }

	        this.renderer.render();
	        this.plugins.render();

        	if (this.onRenderCallback)
        	{
	            this.onRenderCallback.call(this.callbackContext);
        	}

	        this.plugins.postRender();
        }
        else
        {
        	//	Still loading assets
	        if (this.onLoadUpdateCallback)
	        {
	            this.onLoadUpdateCallback.call(this.callbackContext);
	        }
	
	        this.world.postUpdate();
	        this.plugins.postUpdate();
	        this.plugins.preRender();
	        this.renderer.render();
	        this.plugins.render();

        	if (this.onLoadRenderCallback)
        	{
            	this.onLoadRenderCallback.call(this.callbackContext);
        	}

	        this.plugins.postRender();
        }

	},

	/**
    * Switch to a new State.
    * @param state {State} The state you want to switch to.
    * @param [clearWorld] {bool} clear everything in the world? (Default to true)
    * @param [clearCache] {bool} clear asset cache? (Default to false and ONLY available when clearWorld=true)
    */
    switchState: function (state, clearWorld, clearCache) {

        if (typeof clearWorld === "undefined") { clearWorld = true; }
        if (typeof clearCache === "undefined") { clearCache = false; }

        if (this.isBooted == false) {
            this._pendingState = state;
            return;
        }

        //  Destroy current state?
        if (this.onDestroyCallback !== null) {
            this.onDestroyCallback.call(this.callbackContext);
        }

        this.input.reset(true);

        //  Prototype?
        if (typeof state === 'function')
        {
            this.state = new state(this);
        }
        else
        {
            this.state = state;
        }

        //  Ok, have we got at least a create or update function?
        if (this.state['create'] || this.state['update']) {

            this.callbackContext = this.state;

            //  Bingo, let's set them up
            this.onPreloadCallback = this.state['preload'] || null;
            this.onLoadRenderCallback = this.state['loadRender'] || null;
            this.onLoadUpdateCallback = this.state['loadUpdate'] || null;
            this.onCreateCallback = this.state['create'] || null;
            this.onUpdateCallback = this.state['update'] || null;
            this.onPreRenderCallback = this.state['preRender'] || null;
            this.onRenderCallback = this.state['render'] || null;
            this.onPausedCallback = this.state['paused'] || null;
            this.onDestroyCallback = this.state['destroy'] || null;
            
            if (clearWorld) {

                //this.world.destroy();

                if (clearCache == true) {
                    this.cache.destroy();
                }
            }

            this._loadComplete = false;

            this.startState();

        }
        else
        {
            console.warn("Invalid Phaser State object given. Must contain at least a create or update function.");
        }
    },

	/**
    * Nuke the entire game from orbit
    */
    destroy: function () {

        this.callbackContext = null;
        this.onPreloadCallback = null;
        this.onLoadRenderCallback = null;
        this.onLoadUpdateCallback = null;
        this.onCreateCallback = null;
        this.onUpdateCallback = null;
        this.onRenderCallback = null;
        this.onPausedCallback = null;
        this.onDestroyCallback = null;
        this.cache = null;
        this.input = null;
        this.load = null;
        this.sound = null;
        this.stage = null;
        this.time = null;
        this.world = null;
        this.isBooted = false;

    }

};