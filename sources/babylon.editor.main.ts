﻿module BABYLON.EDITOR {
    export class EditorMain implements IDisposable {
        // public members
        public core: EditorCore;
        public editionTool: EditionTool;

        public container: string;
        public antialias: boolean;
        public options: any;

        public layouts: GUI.IGUILayout = null;

        // private members

        /**
        * Constructor
        */
        constructor(containerID: string, antialias: boolean = false, options: any = null) {
            // Initialize
            this.core = new EditorCore();
            this.core.editor = this;

            this.container = containerID;
            this.antialias = antialias;
            this.options = options;

            // Create Main UI
            this._createUI();
            this._createBabylonEngine();

            // Edition tool
            this.editionTool = new EditionTool(this.core);
            this.editionTool.createUI();
        }

        /**
        * Creates the UI
        */
        private _createUI() {
            this.layouts = new GUI.GUILayout(this.container);

            this.layouts.createPanel("BABYLON-EDITOR-EDITION-TOOL-PANEL", "left", 380, true).setContent("<div id=\"BABYLON-EDITOR-EDITION-TOOL\"></div>");
            this.layouts.createPanel("BABYLON-EDITOR-TOP-TOOLBAR-PANEL", "top", 70, false).setContent("");
            this.layouts.createPanel("BABYLON-EDITOR-GRAPH-PANEL", "right", 350, true).setContent("");
            this.layouts.createPanel("BABYLON-EDITOR-MAIN-PANEL", "main", undefined, undefined).setContent('<canvas id="BABYLON-EDITOR-MAIN-CANVAS"></canvas>');
            this.layouts.createPanel("BABYLON-EDITOR-PREVIEW-PANEL", "preview", 70, true).setContent("");

            this.layouts.buildElement(this.container);
        }

        /**
        * Creates the babylon engine
        */
        private _createBabylonEngine(): void {
            this.core.canvas = <HTMLCanvasElement>document.getElementById("BABYLON-EDITOR-MAIN-CANVAS");

            this.core.engine = new Engine(this.core.canvas, this.antialias, this.options);
            this.core.currentScene = new Scene(this.core.engine);
            this.core.scenes.push({ render: true, scene: this.core.currentScene });

            var camera = new FreeCamera("MainCamera", new Vector3(10, 10, 10), this.core.currentScene);
            camera.setTarget(new Vector3(0, 0, 0));
            camera.attachControl(this.core.canvas);
        }

        /**
        * Simply update the scenes and updates
        */
        public update(): void {
            // Pre update
            this.core.onPreUpdate();

            // Scenes
            for (var i = 0; i < this.core.scenes.length; i++) {
                if (this.core.scenes[i].render) {
                    this.core.scenes[i].scene.render();
                }
            }

            // Post update
            this.core.onPostUpdate();
        }

        public dispose(): void {

        }
    }
}