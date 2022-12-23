import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Enemies } from 'src/app/classes/enemies';
import { Player } from 'src/app/classes/player';
import { Projectile } from 'src/app/classes/projectile';
import { gsap } from 'gsap';
import { Burst } from 'src/app/classes/burst';
import { Howl } from 'howler';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css']
})
export class CanvasComponent implements OnInit {
  canvas!: HTMLCanvasElement;
  ctx!: CanvasRenderingContext2D;
  player!: Player;
  projectiles: Array<Projectile> = new Array;
  enemyArr: Array<Enemies> = new Array;
  bursts: Array<Burst> = new Array;
  animationId!: number;
  score: number = 0;
  level: number = 1;
  start!: HTMLElement;
  display = 'block';
  interval: any;
  explosion: any = new Audio();
  bg: any = new Audio()

  constructor() {
    addEventListener('click', (e) => {
      const vel = this.velocity(e.clientY, e.clientX, 'projectile');
      let projectile = new Projectile(innerWidth / 2, innerHeight / 2, 5, 'white', {x: vel.x, y: vel.y});
      this.projectiles.push(projectile);
    });
  }

  ngOnInit(): void {
    this.canvas = document.querySelector('canvas')!;
    this.canvas.width = innerWidth;
    this.canvas.height = innerHeight - 5;
    this.ctx = this.canvas.getContext('2d')!;
    this.player = new Player(innerWidth/2,innerHeight/2,20,'white');
    this.explosion.src = "../../assets/explosion.wav";
    this.explosion.volume = .5;
    this.explosion.load();
    let audio = new Howl({
      src: ['../../assets/sg.mp3'],
      loop: true,
    })
    audio.play();
  }

  init(){
    this.player.draw(this.ctx)
    this.enemyArr = [];
    this.bursts = [];
    this.projectiles = [];
    this.score = 0;
    this.level = 1;
  }

  animate() {

    this.animationId = requestAnimationFrame(()=> this.animate());
    this.ctx.fillStyle = "rgba(0,0,0,0.1)"
    this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
    this.player.draw(this.ctx);
    // Level increase
    this.levelCheck();

    this.bursts.forEach((burst, index) => {
      if(burst.alpha <= 0) {
        this.bursts.splice(index, 1)
      }else {
        burst.draw(this.ctx);
        burst.update();
      }
    })
    this.projectiles.forEach((projectile, index) => {
      projectile.draw(this.ctx);
      projectile.update();
      // Projectile removal
      if(projectile.x + projectile.radius < 0 || 
        projectile.x - projectile.radius > this.canvas.width ||
        projectile.y + projectile.radius < 0 ||
        projectile.y - projectile.radius > this.canvas.height) {
        setTimeout(()=> {
          this.projectiles.splice(index, 1);
        },0);
      }
    });
    this.enemyArr.forEach((enemy, index)=> {
      enemy.draw(this.ctx);
      enemy.update();

      // Player collision detection || End game
      const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
      if(dist - enemy.radius - this.player.radius < 1) {
        setTimeout(()=> {
          cancelAnimationFrame(this.animationId);
          this.display = "block";
          clearInterval(this.interval);
        },0);
      }

      // Projectile collision
      this.projectiles.forEach((projectile, pIndex)=> {
        const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
        if(dist - enemy.radius - projectile.radius < 1) {
          // Burst creations
          this.burstCreation(projectile, enemy);
          if(enemy.radius - 10 > 5) {
            this.score += 50; 
            gsap.to(enemy, {
              radius: enemy.radius - 10
            });
            setTimeout(()=> {
              this.projectiles.splice(pIndex, 1);
            },0);
          } else {
            this.explosion.play();
            this.score += 125;
            setTimeout(()=> {
              this.enemyArr.splice(index, 1);
              this.projectiles.splice(pIndex, 1);
            },0);
          }
        }
      })
    });
  }

  velocity(y:number, x: number, type: string){
    let angle;
    let velocity;
    if(type === "projectile") {
      angle = Math.atan2(y - this.canvas.height / 2, x - this.canvas.width /2);
      velocity = {x: Math.cos(angle) * 5, y: Math.sin(angle) * 5}
    } else {
      // Level check 
      if(this.level > 1) {
        let spdInc = (this.level -1) * .1 + 1;
        angle = Math.atan2(this.canvas.height / 2 - y, this.canvas.width /2 - x);
        velocity = {x: Math.cos(angle) * spdInc, y: Math.sin(angle) * spdInc}
      } else {
        angle = Math.atan2(this.canvas.height / 2 - y, this.canvas.width /2 - x);
        velocity = {x: Math.cos(angle), y: Math.sin(angle)}
      }
    }
    return velocity;
  }

  enemySpawn() {
    this.interval = setInterval(() => {
      const radius = Math.random() * (30 - 5) + 5;
      let x;
      let y;
      if(Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - radius : this.canvas.width + radius;
        y = Math.random() * this.canvas.height;
      } else {
        x = Math.random() * this.canvas.width;
        y = Math.random() < 0.5 ? 0 - radius : this.canvas.height + radius;
      }
      const color = `hsl(${Math.random() * 360}, 50%, 50%)`
      const velocity = this.velocity(y, x, 'enemy');
      const e = new Enemies(x, y, radius, color, {x: velocity.x, y: velocity.y});
      this.enemyArr.push(e);
      
    }, 1000);
  }

  burstCreation(projectile:Projectile, enemy:Enemies) {
    
    for(let i = 0; i < enemy.radius * 2; i++) {
      this.bursts.push(new Burst(projectile.x, projectile.y, Math.random() * 2, enemy.color, {
        x: (Math.random() - 0.5) * (Math.random() * 5),
        y: (Math.random() - 0.5) * (Math.random() * 5)
      }));
    }
  }

  startGame() {
    this.display = 'none';
    this.init();
    this.animate();
    this.enemySpawn();
  }

  levelCheck() {
    if(this.level == 1 && this.score >= 10000) {
      this.level ++;
    } else if(this.level > 1) {
      let scoreToBeat = 0;
      for(let i = 1; i <= this.level; i++) {
        scoreToBeat = scoreToBeat + (i * 10000)
      }
      if(this.score >= scoreToBeat) {
        this.level ++;
      }
    }
  }
}

