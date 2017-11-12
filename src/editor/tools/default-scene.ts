import {
    Scene,
    PointLight, Mesh, MeshBuilder,
    PBRMaterial, Texture, CubeTexture, StandardMaterial,
    Vector3, Color3,
    ActionManager, StateCondition, SwitchBooleanAction,
    Animation,
    SceneSerializer, FilesInput, SpotLight, ShadowGenerator, DirectionalLight, ExecuteCodeAction, Color4
} from 'babylonjs';

import {
    AdvancedDynamicTexture,
    Rectangle, Line, TextBlock,
    Control
} from 'babylonjs-gui';

import Tools from './tools';

export default class DefaultScene {
    /**
     * Creates a texture file and returns the given texture
     * @param url: the url of the texture
     * @param scene: the scene where to add the texture
     */
    public static async LoadTexture (url: string, scene: Scene): Promise<Texture> {
        await Tools.CreateFileFromURL(url);

        const name = Tools.GetFilename(url);

        const texture = new Texture('file:' + name, scene);
        texture.name = texture['url'] = name;

        return texture;
    }

    /**
     * Creates a new label
     * @param gui: the gui texture
     * @param mesh: the mesh to attach
     * @param str: the string to draw
     * @param lines: if draw lines
     */
    public static CreateLabel (gui: AdvancedDynamicTexture, mesh: Mesh, str: string, lines: boolean): Rectangle {
        // PBR GUI
        const label = new Rectangle(str);
        label.background = 'black'
        label.height = '30px';
        label.alpha = 0.5;
        label.width = '300px';
        label.cornerRadius = 20;
        label.thickness = 1;
        label.linkOffsetY = 30;
        label.top = '0%';
        label.zIndex = 5;
        label.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        label.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
        gui.addControl(label);

        const text = new TextBlock();
        text.text = str;
        text.color = 'white';
        label.addControl(text);
    
        if (!lines) {
            label.linkWithMesh(mesh);
            return label;
        }

        var line = new Line();
        line.alpha = 0.5;
        line.lineWidth = 5;
        line.dash = [5, 10];
        gui.addControl(line);
        line.linkWithMesh(mesh);
        line.connectedControl = label;

        return label;
    }

    /**
     * Creates the default scene
     * @param scene: the scene reference where to create objects
     */
    public static async Create (scene: Scene): Promise<void> {
        // Misc.
        scene.clearColor = new Color4(0, 0, 0, 1);

        // Image processing
        scene.imageProcessingConfiguration.contrast = 1;
        scene.imageProcessingConfiguration.exposure = 1;
        scene.imageProcessingConfiguration.toneMappingEnabled = true;

        // HDR
        let hdrTexture: CubeTexture = null;
        
        // Floor
        const floor = await this.LoadTexture('assets/textures/mahogfloor_basecolor.png', scene);
        floor.uScale = floor.vScale = 45;

        const floorBump = await this.LoadTexture('assets/textures/mahogfloor_normal.jpg', scene);
        floorBump.uScale = floorBump.vScale = 45;

        const floorAmbient = await this.LoadTexture('assets/textures/mahogfloor_AO.jpg', scene);
        floorAmbient.uScale = floorAmbient.vScale = 45;

        const floorReflectivity = await this.LoadTexture('assets/textures/mahogfloor_roughness.jpg', scene);
        floorReflectivity.uScale = floorReflectivity.vScale = 45;

        // Metal
        const metal = await this.LoadTexture('assets/textures/rustediron2_basecolor.png', scene);
        const metalBump = await this.LoadTexture('assets/textures/rustediron2_normal.png', scene);
        const metalReflectivity = await this.LoadTexture('assets/textures/rustediron2_roughness.png', scene);
        const metalMetallic = await this.LoadTexture('assets/textures/rustediron2_metallic.png', scene);

        // Standard
        const wood = await this.LoadTexture('assets/textures/albedo.png', scene);
        const woodReflectivity = await this.LoadTexture('assets/textures/reflectivity.png', scene);

        // Documentation
        const documentation = await this.LoadTexture('assets/textures/documentation.png', scene);

        // Skybox
        const skyboxMaterial = new PBRMaterial('SkyboxMaterial', scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.microSurface = 0.85;
        skyboxMaterial.cameraExposure = 0.6;
        skyboxMaterial.cameraContrast = 1.6;
        skyboxMaterial.disableLighting = true;

        await Tools.CreateFileFromURL("assets/textures/environment.dds").then(() => {
            hdrTexture = CubeTexture.CreateFromPrefilteredData("file:environment.dds", scene);
            hdrTexture.gammaSpace = false;
    
            skyboxMaterial.reflectionTexture = hdrTexture.clone();
            skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    
            hdrTexture.name = hdrTexture.url = "skybox.dds";
            skyboxMaterial.reflectionTexture.name = skyboxMaterial.reflectionTexture['url'] = "environment.dds";
        });

        const skybox = Mesh.CreateBox("hdrSkyBox", 1000, scene);
        skybox.material = skyboxMaterial;
        skybox.infiniteDistance = true;

        // Plane
        const groundMaterial = new PBRMaterial('GroundMaterial', scene);
        groundMaterial.usePhysicalLightFalloff = false;
        groundMaterial.microSurface = 0.95;
        groundMaterial.albedoTexture = floor;
        groundMaterial.bumpTexture = floorBump;
        groundMaterial.ambientTexture = floorAmbient;
        groundMaterial.useParallax = true;
        groundMaterial.useParallaxOcclusion = true;
        groundMaterial.parallaxScaleBias = 0.02;
        groundMaterial.reflectivityColor.set(0.1, 0.1, 0.1);
        groundMaterial.reflectionTexture = hdrTexture;

        const ground = Mesh.CreateGround('Ground', 512, 512, 32, scene);
        ground.receiveShadows = true;
        ground.material = groundMaterial;

        // Sphere PBR
        const sphereMaterialPBR = new PBRMaterial('SpherePBR', scene);
        sphereMaterialPBR.albedoTexture = metal;
        sphereMaterialPBR.bumpTexture = metalBump;
        sphereMaterialPBR.reflectivityTexture = metalReflectivity;
        sphereMaterialPBR.ambientTexture = metalMetallic;
        sphereMaterialPBR.reflectionTexture = hdrTexture;

        const spherePBR = Mesh.CreateSphere('Sphere PBR', 32, 5, scene);
        spherePBR.position.set(-5, 3, 0);
        spherePBR.material = sphereMaterialPBR;

        // Sphere Standard
        const sphereMaterialStd = new StandardMaterial('SphereStandard', scene);
        sphereMaterialStd.diffuseTexture = wood;
        sphereMaterialStd.specularTexture = woodReflectivity;

        const sphereStd = Mesh.CreateSphere('Sphere Standard', 32, 5, scene);
        sphereStd.position.set(5, 3, 0);
        sphereStd.material = sphereMaterialStd;

        // Plane
        const planeMaterial = new StandardMaterial('PlaneMaterial', scene);
        planeMaterial.emissiveTexture = documentation;

        const plane = Mesh.CreatePlane('Documentation Plane', 100, scene);
        plane.rotation.y = Math.PI;
        plane.position.set(0, 55, -135);
        plane.scaling.set((1280 / 800), 1, 1);
        plane.material = planeMaterial;

        plane.actionManager = new ActionManager(scene);
        plane.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnDoublePickTrigger, (evt) => {
            window.open('http://doc.babylonjs.com/resources');
        }));

        // Light
        const spot = new SpotLight('Spot Light', new Vector3(20, 20, 20), new Vector3(-1, -2, 0), 2.4, 2.4, scene);
        const shadows = new ShadowGenerator(2048, spot, true);
        shadows.usePoissonSampling = true;
        shadows.getShadowMap().renderList = [spherePBR, sphereStd];

        // GUI
        const gui = AdvancedDynamicTexture.CreateFullscreenUI('ui');
        gui.layer.layerMask = 2;

        // Labels
        this.CreateLabel(gui, sphereStd, 'Standard Material', false);
        this.CreateLabel(gui, spherePBR, 'PBR Material', false);
        this.CreateLabel(gui, plane, 'Documentation (Double Click)', false);

        // Scene file
        const serializedScene = SceneSerializer.Serialize(scene);
        const serializedSceneFile = Tools.CreateFile(Tools.ConvertStringToUInt8Array(JSON.stringify(serializedScene)), 'scene.babylon');
        FilesInput.FilesToLoad['scene.babylon'] = serializedSceneFile;

        // Pickable
        scene.meshes.forEach(m => m.isPickable = true);
    }
}

/**
var material = null;
var canvas = scene.getEngine().getRenderingCanvas();

// Called once starting the scripts
this.start = function () {
    material = scene.getMaterialByName('GroundMaterial');
    material.microSurface = 0.75;

    canvas.addEventListener('click', function (evt) {
        var pick = scene.pick(evt.offsetX, evt.offsetY);
        if (pick.pickedMesh === mesh) {
            var anim = new BABYLON.Animation('anim', 'microSurface', 60,
                                             BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                                             BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE, false);
            anim.setKeys([
                { frame: 0, value: 0.75 },
                { frame: 500, value: 0.92 }
            ]);
            
            var animate = new BABYLON.Animatable(scene, material, 0, 500, false, 1.0);
            animate.appendAnimations(material, [anim]);
        }
    });
}

// Called on each update
this.update = function () {
    // Your code...
}
 */