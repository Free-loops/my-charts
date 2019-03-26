import {max, min, scaleLinear} from 'd3'
let d3 = {max, min, scaleLinear}

class Hierarchy {
  constructor (config) {
    this.domCtx = config.el.getContext('2d')
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0)'
    this.scale = config.scale || 100
    this.plottingScale = null
    this.domCtx.canvas.height = config.el.parentElement.clientHeight
    this.domCtx.canvas.width = config.el.parentElement.clientWidth
    this.ctx.canvas.height = config.el.parentElement.clientHeight
    this.ctx.canvas.width = config.el.parentElement.clientWidth
    // this.ctx.scale(0.5, 0.5)
    this.innerRadius = this.ctx.canvas.height * config.innerRadius || this.ctx.canvas.height * 0.2 // 内圆半径
    this.centerPoint = config.centerPoint || {x: this.ctx.canvas.width / 2, y: this.ctx.canvas.height / 2} // 图形中心点
    this.series = config.series
    this.filter = config.filter
    this.needAnimation = config.animation || true // 开启初始化动画
    this.needFluctuate = config.fluctuate || true // 开启波动
    this.baseDataFactor = 1 // 缩小内圆半径 增加数据显示范围
    this.t = 0
    this.fc = config.fc || 0.001 // 波动增量
    this.fr = config.fr || 4 // 波动幅度
    if (this.needAnimation) {
      this.initAnimation()
    } else if (this.needFluctuate) {
      this.t = 0.1
      this.fluctuateAnimation()
    } else {
      this.init()
    }
  }
  init () {
    this.clearChart()
    this.pitZero()
    this.getPlottingScale()
    this.drawBubble()
    this.series.forEach((item, index) => {
      item.scaleData = this.getScaleData(item.data, index)
      item.points = this.getPointsByValue(item.scaleData)
      item.ControlPoint = this.getControlPoint(item.points)
      this.filter && this.filter(item, index) // 数据遍历器
      item.data.forEach((d, i) => {
        item.filter && item.filter(d, i) // 数据遍历器
      })
      this.drawPath(item)
    })
    this.drawCircle()
    this.drawImage()
  }
  pitZero () {
    if (this.series.length === 0) {
      this.noData = true
      let rgb = [33, 200, 135]
      let rbgstr = rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ','
      for (let i = 8; i > 0; i--) {
        this.series.push({
          data: [{value: 0}, {value: 0}, {value: 0}, {value: 0}, {value: 0}, {value: 0}, {value: 0}],
          colorStop: ['rgba(' + rbgstr + i / 10 + ')', 'rgba(' + rbgstr + (i - 1) / 10 + ')']
        })
      }
    }
  }
  initAnimation () {
    let scale = this.scale
    this.scale = 10
    let animation = () => {
      if (this.scale < scale) {
        requestAnimationFrame(animation)
        this.scale ++
        this.init()
      } else if (this.needFluctuate) {
        this.t = 0.1
        this.fluctuateAnimation()
      }
    }
    animation()
  }
  fluctuateAnimation () {
    let animation = () => {
      requestAnimationFrame(animation)
      this.init()
    }
    animation()
  }
  getScaleData (data, index) {
    let scaleData = []
    data.forEach((d, i) => {
      if (this.t !== 0) {
        this.t = this.t + Math.random() * this.fc
      }
      // t 缩放 index 异步 i 扭曲
      scaleData.push(this.plottingScale(d.value) - Math.sin(this.t - i + index) * this.fr)
    })
    return scaleData
  }
  getPlottingScale () {
    let maxs = []
    let max
    if (this.noData) {
      max = 100
    } else {
      this.series.forEach(item => {
        maxs.push(d3.max(item.data, d => d.value))
      })
      max = d3.max(maxs)
    }
    this.plottingScale = d3.scaleLinear().range([0, this.scale]).domain([0, max])
  }
  getPointsByValue (data) {
    let points = []
    let averageRadian = Math.PI * 2 / data.length
    data.forEach((item, i) => {
      let radian = averageRadian * i
      let x, y
      if (radian <= Math.PI / 2) {
        let xside = Math.cos(radian) * (this.innerRadius + item)
        let yside = Math.sin(radian) * (this.innerRadius + item)
        x = this.centerPoint.x - xside
        y = this.centerPoint.y - yside
      } else if (radian <= Math.PI) {
        radian = Math.PI - radian
        let xside = Math.cos(radian) * (this.innerRadius + item)
        let yside = Math.sin(radian) * (this.innerRadius + item)
        x = this.centerPoint.x + xside
        y = this.centerPoint.y - yside
      } else if (radian <= Math.PI * 3 / 2) {
        radian = radian - Math.PI
        let xside = Math.cos(radian) * (this.innerRadius + item)
        let yside = Math.sin(radian) * (this.innerRadius + item)
        x = this.centerPoint.x + xside
        y = this.centerPoint.y + yside
      } else {
        radian = Math.PI * 2 - radian
        let xside = Math.cos(radian) * (this.innerRadius + item)
        let yside = Math.sin(radian) * (this.innerRadius + item)
        x = this.centerPoint.x - xside
        y = this.centerPoint.y + yside
      }
      points.push({x, y})
    })
    return points
  }
  getControlPoint (path) {
    path = path.concat([path[0], path[1], path[2]])
    var rt = 0.3
    var count = path.length - 2
    var arr = []
    for (let i = 0; i < count; i++) {
      var a = path[i]; var b = path[i + 1]; var c = path[i + 2]
      var v1 = new Vector2(a.x - b.x, a.y - b.y)
      var v2 = new Vector2(c.x - b.x, c.y - b.y)
      var v1Len = v1.length(); var v2Len = v2.length()
      var centerV = v1.normalize().add(v2.normalize()).normalize()
      var ncp1 = new Vector2(centerV.y, centerV.x * -1)
      var ncp2 = new Vector2(centerV.y * -1, centerV.x)
      var p1; var p2
      if (ncp1.angle(v1) < 90) {
        p1 = ncp1.multiply(v1Len * rt).add(b)
        p2 = ncp2.multiply(v2Len * rt).add(b)
        arr.push(p1, p2)
      } else {
        p1 = ncp1.multiply(v2Len * rt).add(b)
        p2 = ncp2.multiply(v1Len * rt).add(b)
        arr.push(p2, p1)
      }
    }
    return arr
  }
  drawPath (series) {
    var points = series.points.concat([series.points[0], series.points[1], series.points[2]])
    var point = series.ControlPoint
    this.ctx.beginPath()
    var int = 1
    for (var i = 0; i < points.length; i++) {
      if (i === 0) {
        this.ctx.moveTo(points[1].x, points[1].y)
      } else if (i < points.length - 2) {
        this.ctx.bezierCurveTo(point[int].x, point[int].y, point[int + 1].x, point[int + 1].y, points[i + 1].x, points[i + 1].y)
        int += 2
      }
    }
    var grd = this.ctx.createRadialGradient(this.centerPoint.x, this.centerPoint.y, this.innerRadius, this.centerPoint.x, this.centerPoint.y, this.innerRadius + this.scale)
    grd.addColorStop(0, series.colorStop[0])
    grd.addColorStop(1, series.colorStop[1])
    // 填充渐变
    this.ctx.fillStyle = grd
    this.ctx.fill()
    this.ctx.closePath()
  }
  drawCircle () {
    this.ctx.beginPath()
    this.ctx.arc(this.centerPoint.x, this.centerPoint.y, this.innerRadius * this.baseDataFactor, 0, 2 * Math.PI)
    this.ctx.fillStyle = '#fff'
    this.ctx.fill()
    this.ctx.closePath()
  }
  drawBubble () {
    let arr = []
    for (let i = 0; i < 5; i++) {
      arr = arr.concat(this.getRandomPoints())
    }
    if (!this.bubblePoints) {
      this.bubblePoints = arr
    }
    this.bubblePoints.forEach((item, i) => {
      let disx = Math.abs(item.x - this.centerPoint.x)
      let disy = Math.abs(item.y - this.centerPoint.y)
      let dis = Math.sqrt(disx * disx + disy * disy)
      let a = (this.centerPoint.y - item.y) / (this.centerPoint.x - item.x)
      let b = item.y - a * item.x
      // y = a * x + b // 斜截式直线方程
      if (disx <= 50) item.k = 0.2
      if (disx <= 1) item.x = this.centerPoint.x
      if (item.x > this.centerPoint.x) {
        item.x = item.x - item.k
        item.y = item.x * a + b
      } else if (item.x < this.centerPoint.x) {
        item.x = item.x + item.k
        item.y = item.x * a + b
      } else {
        if (item.y > this.centerPoint.y) {
          item.y = item.y - item.k
        } else {
          item.y = item.y + item.k
        }
      }
      if (dis <= this.innerRadius * this.baseDataFactor) {
        item.x = arr[i].x
        item.y = arr[i].y
      }
      this.ctx.beginPath()
      this.ctx.arc(item.x, item.y, item.r, 0, 2 * Math.PI)
      this.ctx.fillStyle = this.series[this.series.length - 1] ? this.series[this.series.length - 1].colorStop[0] : '#7CE4A5'
      this.ctx.fill()
      this.ctx.closePath()
    })
  }
  getRandomPoints () {
    let x1 = Math.random() * this.ctx.canvas.width / 4; let y1 = Math.random() * this.ctx.canvas.height
    let x2 = Math.random() * this.ctx.canvas.width; let y2 = Math.random() * this.ctx.canvas.height / 4
    let x3 = this.ctx.canvas.width * Math.random() + this.ctx.canvas.width * 3 / 4; let y3 = Math.random() * this.ctx.canvas.height
    let x4 = this.ctx.canvas.width * Math.random() + this.ctx.canvas.width * 3 / 4; let y4 = Math.random() * this.ctx.canvas.height
    let x5 = Math.random() * this.ctx.canvas.width; let y5 = this.ctx.canvas.height * Math.random() + this.ctx.canvas.height * 3 / 4
    let x6 = Math.random() * this.ctx.canvas.width; let y6 = this.ctx.canvas.height * Math.random() + this.ctx.canvas.height * 3 / 4
    let arr = [
      {x: x1, y: y1, r: Math.random() * 2 + 2, k: Math.random() * 0.3 + 0.2},
      {x: x2, y: y2, r: Math.random() * 2 + 2, k: Math.random() * 0.3 + 0.2},
      {x: x3, y: y3, r: Math.random() * 2 + 2, k: Math.random() * 0.3 + 0.2},
      {x: x4, y: y4, r: Math.random() * 2 + 2, k: Math.random() * 0.3 + 0.2},
      {x: x5, y: y5, r: Math.random() * 2 + 2, k: Math.random() * 0.3 + 0.2},
      {x: x6, y: y6, r: Math.random() * 2 + 2, k: Math.random() * 0.3 + 0.2}
    ]
    return arr
  }
  drawImage () {
    this.domCtx.drawImage(this.canvas, 0, 0)
  }
  drawText () {}
  clearChart () {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
    this.domCtx.clearRect(0, 0, this.domCtx.canvas.width, this.domCtx.canvas.height)
  }
}
class Vector2 {
  constructor (x, y) {
    this.x = x
    this.y = y
  }
  length () {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }
  normalize () {
    var inv = 1 / this.length()
    return new Vector2(this.x * inv, this.y * inv)
  }
  add (v) {
    return new Vector2(this.x + v.x, this.y + v.y)
  }
  multiply (f) {
    return new Vector2(this.x * f, this.y * f)
  }
  dot (v) {
    return this.x * v.x + this.y * v.y
  }
  angle (v) {
    return Math.acos(this.dot(v) / (this.length() * v.length())) * 180 / Math.PI
  }
}
export default Hierarchy
