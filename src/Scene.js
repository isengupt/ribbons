import React, { Component } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { fragment } from "./shaders/fragment";
import { vertex } from "./shaders/vertex";

class Ribbon {
  constructor(material) {
    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 300);
    this.m = material;
    this.m = new THREE.MeshPhysicalMaterial({
      color: 0xff0000*Math.random(),
      side: THREE.DoubleSide,
    });
    
    material.wireframe = true;

    this.width = 1;

    this.mesh = new THREE.Mesh(this.geometry, this.m);
    this.mesh.dynamic = true;
    this.speed = 1;
    this.travel = 0;

    this.position = new THREE.Vector3(0, 0, 0);
  }

  update(time, target) {
    time *= 0.5;
    // console.log(this);
    this.pp = [...this.geometry.attributes.position.array];

    for (let j = 0; j < 6; j++) {
      this.pp.pop();
    }

   

    //this.position.x = Math.sin(time * 5.5) * (4 + Math.sin(time * 7));
    //this.position.y = Math.cos(time * 3) * (3 + Math.sin(time * 5));

    this.nextPos = new THREE.Vector3().lerpVectors(this.position,target, 0.1)

    this.travel += this.nextPos.distanceTo(this.position)

    this.position = this.nextPos;

    let rot = [
      (Math.sin(this.travel/5) * this.width) / 2,
      (Math.cos(this.travel/5) * this.width) / 2,
    ];

    this.position.z = 3 * Math.sin(this.travel/5)
    this.pp.unshift(
      this.position.x + rot[0],
      this.position.y + time * 0,
      this.position.z + rot[1]
    );
    this.pp.unshift(
      this.position.x - rot[0],
      this.position.y + time * 0,
      this.position.z - rot[1]
    );

    this.geometry.attributes.position.array = new Float32Array(this.pp);

    this.geometry.attributes.position.needsUpdate = true;

    this.geometry.computeVertexNormals()
    this.geometry.computeFaceNormals()

    this.m.color = new THREE.Color(`hsl(${200 + 100*Math.sin(time*4)},100%, 50%)`);
  }
}
class Scene extends Component {
  constructor(props) {
    super(props);

    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.animate = this.animate.bind(this);
  }
  componentDidMount() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    this.width = this.mount.clientWidth;
    this.height = this.mount.clientHeight;
    this.renderer.setClearColor(0xeeeeee, 1);
    this.renderer.setSize(this.width, this.height);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.mouse = new THREE.Vector2();
    this.target = new THREE.Vector3(0,0,0);
    this.raycaster = new THREE.Raycaster();

    this.container = document.getElementById("scene");

    this.mount.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.001,
      1000
    );

    this.camera.position.set(0, 0, 15);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.time = 0;
    this.setupResize();
    this.addObjects();
    this.animate();
    this.lighting();
    this.mouseEvents();
    this.resize();
    
  }

  mouseEvents() {
    var that = this;

    this.touchme = new THREE.Mesh(
      new THREE.PlaneGeometry(40,40,20,20),
      new THREE.MeshBasicMaterial({color: 0x000000, wireframe: true})
    )

    //this.scene.add(this.touchme)

    
    function onMouseMove( event ) {

      // calculate mouse position in normalized device coordinates
      // (-1 to +1) for both components
    
      that.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      that.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

      that.raycaster.setFromCamera( that.mouse, that.camera );

      // calculate objects intersecting the picking ray
      const intersects = that.raycaster.intersectObjects( [that.touchme] );

      that.target = intersects[0].point;
    
    }

    this.container.addEventListener( 'mousemove', onMouseMove, false );
    
  }

  lighting() {
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);

    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);

    directionalLight.position.set(-1, -1, -1);
    this.scene.add(directionalLight);

    var light = new THREE.AmbientLight(0x404040);
    this.scene.add(light);
  }

  addObjects() {
    let that = this;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable",
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { type: "f", value: 0 },

        resolution: { type: "v4", value: new THREE.Vector4() },
        uvRate1: {
          value: new THREE.Vector2(1, 1),
        },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.ribbons = [];
    for (let i = 0; i < 1; i++) {
      let ribbon = new Ribbon(this.material);
      this.scene.add(ribbon.mesh);

      this.ribbons.push(ribbon);
    }

    //this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

    //this.plane = new THREE.Mesh(this.geometry, this.material);

    //this.scene.add(this.plane);
  }

  setupResize = () => {
    window.addEventListener("resize", this.resize);
  };

  resize = () => {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    console.log("resize");

    this.imageAspect = 853 / 1280;
    /* 
    let a1;
    let a2;

    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = this.height / this.width / this.imageAspect;
    }

    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    const dist = this.camera.position.z;
    const height = 1;
    this.camera.fov = 2* (180/Math.PI) * Math.atan(height/(2*dist));

    if (this.width / this.height > 1) {
      this.plane.scale.x = this.camera.aspect;
    } else {
      this.plane.scale.y = 1 / this.camera.aspect;
    }  */

    this.camera.updateProjectionMatrix();
    console.log(this.camera);
  };

  componentWillUnmount() {
    this.stop();
    this.mount.removeChild(this.renderer.domElement);
  }

  start() {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate);
    }
  }

  stop() {
    cancelAnimationFrame(this.frameId);
  }

  animate() {
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;

    this.frameId = requestAnimationFrame(this.animate);

    this.renderScene();

    this.ribbons.forEach((ribbon) => {
      ribbon.update(this.time, this.target);
    });
  }

  renderScene() {
    this.renderer.render(this.scene, this.camera);
  }

  render() {
    return (
      <div
        id="scene"
        ref={(mount) => {
          this.mount = mount;
        }}
      />
    );
  }
}

export default Scene;
