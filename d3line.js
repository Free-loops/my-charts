import * as d3 from 'd3'

class Line {
  constructor (config) {
    let color = config.color || '#ccc'
    // 是否开启数据驱动颜色
    config.gradeDriveColor && (color = this.driveColor(config))
    let background = config.background || '#fff'
    let defaultConfig = {
      line: {
        width: 1,
        color: color,
        duration: 2500
      },
      areaColor: {start: [0, 0, 0, 0], end: [0, 0, 0, 0]},
      margin: [50, 20, 35, 20],
      xAxios: {
        show: false,
        fontColor: color,
        fontSize: 11
      },
      circle: {
        radius: 5,
        lineColor: color,
        lineWidth: 1,
        fillColor: background
      },
      mark: {
        show: true,
        radius: 2,
        height: 20,
        width: 20,
        triangleH: 8,
        triangleW: 8,
        fontColor: '#263649',
        fontSize: 12,
        lineColor: color,
        fillColor: background,
        markRadius: 0,
        needShadow: true,
        needStroke: false,
        shadow: '0px 4px 15px 0px rgba(38,54,73,0.3)'
      }
    }
    let options = this.deepObjectMerge(defaultConfig, config)
    Object.assign(this, options)
    setTimeout(() => {
      this.svg = d3.select(config.el)
      this.svg.attr('height', this.svg._groups[0][0].clientHeight)
      this.svg.attr('width', this.svg._groups[0][0].clientWidth)
      this.plottingScale = null
      this.scaleData = []
      this.points = []
      this.allData = []
      this.init()
    })
  }
  driveColor (config) {
    // gradeDriveColor 是否开启数据驱动颜色 grade 数据颜色对应关系
    let rgba = this.setColor(config.gradeData, config.grade)
    let color = 'rgba(' + rgba[0] + ',' + rgba[1] + ',' + rgba[2] + ',' + rgba[3] + ')'
    config.areaColor = this.setAreaColor(config.gradeData, config.grade, config.areaColor)
    return color
  }
  setColor (gradeData = 60, grade = [{color: [235, 68, 67, 1], value: 60}, {color: [253, 170, 88, 1], value: 90}, {color: [33, 200, 135, 1], value: 100}]) {
    let color = grade[grade.length - 1].color
    grade.reverse().forEach((item, i) => {
      if (gradeData < item.value) {
        color = item.color
      }
    })
    return color
  }
  setAreaColor (gradeData, grade, areaColor) {
    let rgba = this.setColor(gradeData, grade)
    let s_opacity = areaColor.start[3]
    let e_opacity = areaColor.end[3]
    let start = [rgba[0], rgba[1], rgba[2], s_opacity]
    let end = [rgba[0], rgba[1], rgba[2], e_opacity]
    return {start, end}
  }
  init () {
    this.svg.on('mousemove', null)
    this.clearSvg()
    this.dataToNumber()
    this.getPlottingScale()
    this.getScaleData()
    this.getPointsByValue()
    this.findMaxandMinIndex()
    this.getAllData()
    this.xAxios.show && this.drawAxios()
    this.drawPath()
    if (this.mark.show) {
      this.drawCircle()
      this.drawMark()
      this.mark.needShadow && this.drawMarkShadow()
      this.text()
      setTimeout(() => {
        this.mouseEvent()
      }, 2000)
    }
  }
  dataToNumber () {
    this.data.forEach((item, i) => {
      this.data[i] = item - 0
    })
  }
  getPlottingScale () {
    let max = Math.ceil(d3.max(this.data) / 10) * 10
    if (max === 0) max = 100
    this.plottingScale = d3.scaleLinear().range([0, this.svg.attr('height') - this.margin[0] - this.margin[2]]).domain([0, max])
  }
  getScaleData () {
    let arr = []
    this.data.forEach(item => {
      arr.push(this.plottingScale(item))
    })
    this.scaleData = arr
  }
  getPointsByValue () {
    let arr = []
    let unit = (this.svg.attr('width') - this.margin[1] - this.margin[3]) / (this.data.length - 1)
    this.scaleData.forEach((item, i) => {
      arr.push({
        x: unit * i + this.margin[3],
        y: this.svg.attr('height') - this.margin[2] - item
      })
    })
    this.points = arr
  }
  getAllData () {
    let arr = []
    let max = d3.max(this.data)
    this.data.forEach((item, i) => {
      let markShow = false
      if (max !== 0 && (i === this.MaxandMinIndex.maxIndex || i === this.MaxandMinIndex.minIndex)) {
        markShow = true
      }
      arr.push({
        value: item,
        markShow: markShow,
        point: this.points[i],
        date: this.xAxios && this.xAxios.show ? this.xAxios.data[i] : i
      })
    })
    this.allData = arr
  }
  drawAxios () {
    let that = this
    this.svg.selectAll('.date') // 刻度
    .data(this.allData)
    .enter()
    .append('text')
    .attr('class', 'date')
    .attr('dx', function (d, i) {
      let x = d.point.x - (d.date + '').length * 5 / 2
      if (i === 0) {
        x = d.point.x
      }
      if (i === that.allData.length - 1) {
        x = d.point.x - (d.date + '').length * 6
      }
      return x
    })
    .text(d => d.date)
    .attr('dy', d => this.svg.attr('height') - 15)
    .style('fill', this.xAxios.fontColor)
    .style('font-size', this.xAxios.fontSize)
  }
  drawPath () {
    var points = this.points
    // 画线
    var line = d3.line()
    .x(d => d.x)
    .y(d => d.y)
    .curve(d3.curveMonotoneX)
    let linePath = line(points)
    this.svg.append('svg:path')
    .attr('stroke', this.line.color)
    .attr('fill', d3.rgb(0, 0, 0, 0))
    .attr('stroke-width', this.line.width)
    .style('stroke-dasharray', '2000, 2000')
    .attr('d', linePath)
    .transition()
    .duration(this.line.duration)
    .styleTween('stroke-dashoffset', function () {
      return d3.interpolateNumber(2000, 0)
    })
    // 画区域
    let height = this.svg.attr('height') - this.margin[2]
    var area = d3.area()
    .curve(d3.curveMonotoneX)
    .x(d => d.x)
    .y0(height)
    .y1(d => d.y)
    let path = area(points)
    this.svg.append('svg:path')
    .attr('fill', (d) => {
      let a1 = d3.rgb(this.areaColor.start[0], this.areaColor.start[1], this.areaColor.start[2], this.areaColor.start[3])
      let a2 = d3.rgb(this.areaColor.end[0], this.areaColor.end[1], this.areaColor.end[2], this.areaColor.end[3])
      return 'url(#' + this.linearGradient(a1, a2).attr('id') + ')'
    })
    .attr('d', path)
    // 加区域过渡
    // this.svg.append('svg:rect')
    // .attr('class', 'rect')
    // .attr('width', this.svg.attr('width') - this.margin[1] - this.margin[3])
    // .attr('height', this.svg.attr('height') - this.margin[0] - this.margin[2] + 2 * this.line.width)
    // .attr('x', this.margin[3])
    // .attr('y', this.margin[0] - this.line.width)
    // .attr('fill', '#fff')
    // .transition()
    // .duration(this.line.duration * 3)
    // .attr('x', this.svg.attr('width') + this.margin[3])
  }
  drawCircle () {
    // 下标线
    this.svg.selectAll('.mark-line').data(this.allData).enter().append('path')
    .attr('class', 'mark-line')
    .attr('d', d => {
      let path = d3.path()
      path.moveTo(d.point.x, d.point.y)
      path.lineTo(d.point.x + 0.5, d.point.y)
      let y = this.svg.attr('height') - this.margin[2] - d.point.y
      if (y > 30) {
        y = d.point.y + 30
      } else {
        y = d.point.y + y
      }
      path.lineTo(d.point.x, y - 2)
      path.lineTo(d.point.x, y)
      path.lineTo(d.point.x, y - 2)
      path.lineTo(d.point.x - 0.5, d.point.y)
      path.lineTo(d.point.x, d.point.y)
      d.markLine = path
      if (d.markShow) {
        return path
      } else {
        return ''
      }
    })
    .attr('fill', this.circle.lineColor)
    .attr('stroke', this.circle.lineColor)
    .attr('stroke-width', 0.1)
    // 拐点
    this.svg.selectAll('circle').data(this.allData).enter().append('circle')
    .attr('class', 'x-clicle')
    .attr('r', d => {
      if (d.markShow) {
        return this.circle.radius
      } else {
        return 0
      }
    })
    .attr('cx', d => d.point.x)
    .attr('cy', d => d.point.y)
    .attr('fill', this.circle.fillColor)
    .attr('stroke', this.circle.lineColor)
    .attr('stroke-width', this.circle.lineWidth)
  }
  drawMarkShadow () {
    let y = this.circle.radius + this.mark.triangleH + this.mark.height + 'px'
    d3.select(this.svg._groups[0][0].parentElement).selectAll('.mark-shadow').remove()
    this.divMark = d3.select(this.svg._groups[0][0].parentElement)
    .style('position', 'relative')
    .selectAll('.mark-shadow')
    .data(this.allData).enter().append('div').attr('class', 'mark-shadow')
    .style('width', d => {
      let str = d.value + ''
      return str.length * (this.mark.fontSize / 2 + 1.5) + 10 + 'px'
    })
    .style('height', this.mark.height + 'px')
    .style('position', 'absolute')
    .style('border-radius', '2px')
    .style('top', d => d.point.y + 'px')
    .style('left', d => d.point.x + 'px')
    .style('transform', 'translate(-50%, -' + y + ')')
    .style('box-shadow', this.mark.shadow)
    .style('display', d => {
      if (d.markShow) {
        return 'block'
      } else {
        return 'none'
      }
    })
  }
  drawMark () {
    let radius = this.mark.radius
    this.allData.forEach((item, i) => {
      let str = item.value + ''
      this.mark.width = str.length * (this.mark.fontSize / 2 + 1.5) + 10
      let point = {x: item.point.x, y: item.point.y - this.circle.radius}
      let path = d3.path()
      path.moveTo(point.x, point.y)
      let x1 = point.x - this.mark.triangleW / 2; let y1 = point.y - this.mark.triangleH
      path.lineTo(x1, y1)
      let x2 = x1 - (this.mark.width - this.mark.triangleW) / 2; let y2 = y1
      path.lineTo(x2 + radius, y2)
      path.bezierCurveTo(x2 + radius, y2, x2, y2, x2, y2 - radius)
      let x3 = x2; let y3 = y2 - this.mark.height
      path.lineTo(x3, y3 + radius)
      path.bezierCurveTo(x3, y3 + radius, x3, y3, x3 + radius, y3)
      let x4 = x3 + this.mark.width; let y4 = y3
      path.lineTo(x4 - radius, y4)
      path.bezierCurveTo(x4 - radius, y4, x4, y4, x4, y4 + radius)
      let x5 = x4; let y5 = y4 + this.mark.height
      path.lineTo(x5, y5 - radius)
      path.bezierCurveTo(x5, y5 - radius, x5, y5, x5 - radius, y5)
      let x6 = x5 - (this.mark.width - this.mark.triangleW) / 2; let y6 = y5
      path.lineTo(x6, y6)
      path.lineTo(point.x, point.y)
      item.path = path
    })
    this.svg.selectAll('.mark')
    .data(this.allData)
    .enter()
    .append('path')
    .attr('class', 'mark')
    .attr('fill', this.mark.fillColor)
    .attr('stroke', () => {
      if (this.mark.needStroke) {
        return this.mark.lineColor
      } else {
        return 'none'
      }
    })
    .style('stroke-dasharray', '1000, 1000')
    .attr('d', d => {
      if (d.markShow) {
        return d.path
      } else {
        return ''
      }
    })
    .transition()
    .duration(500)
    .styleTween('stroke-dashoffset', function () {
      return d3.interpolateNumber(1000, 0)
    })
  }
  text () {
    this.svg.selectAll('.label')
    .data(this.allData)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('dx', d => d.point.x - (d.value + '').length * (this.mark.fontSize / 2 + 1.5) / 2)
    .attr('dy', d => d.point.y - this.circle.radius - this.mark.triangleH - (this.mark.height - this.mark.fontSize) / 2 - 1)
    .text(d => d.value)
    .style('fill', this.mark.fontColor)
    .style('font-weight', 500)
    .style('font-size', this.mark.fontSize)
    .style('display', d => {
      if (d.markShow) {
        return 'block'
      } else {
        return 'none'
      }
    })
  }
  mouseEvent () {
    this.svg.on('mousemove', () => {
      let x = d3.event.offsetX
      let y = d3.event.offsetY
      let unit = (this.svg.attr('width') - this.margin[1] - this.margin[3]) / (this.data.length - 1)
      let index = Math.floor((x - this.margin[3]) / unit)
      if ((x - this.margin[3]) % unit > unit / 2) {
        index = index + 1
      }
      if (y > (this.svg.attr('height') - this.margin[2]) || y < this.margin[0] - 10) index = -1
      if (this.hoverIndex === index) return
      this.hoverIndex = index
      let that = this
      this.mark.needShadow && this.divMark.style('display', displayT)
      this.svg.selectAll('.mark-line').attr('d', displayMarkLine)
      this.svg.selectAll('circle').transition().attr('r', displayR)
      this.svg.selectAll('.label').style('display', displayT)
      this.svg.selectAll('.mark').each(displayD)
      function displayT (d, i) {
        if (index === i && i !== 0 && i !== that.data.length - 1) {
          d.markShow = true
        } else if (i !== that.MaxandMinIndex.maxIndex && i !== that.MaxandMinIndex.minIndex) {
          d.markShow = false
        }
        if (d.markShow) {
          return 'block'
        } else {
          return 'none'
        }
      }
      function displayMarkLine (d, i) {
        if (index === i && i !== 0 && i !== that.data.length - 1) {
          d.markShow = true
        } else if (i !== that.MaxandMinIndex.maxIndex && i !== that.MaxandMinIndex.minIndex) {
          d.markShow = false
        }
        if (d.markShow) {
          return d.markLine
        } else {
          return ''
        }
      }
      function displayR (d, i) {
        if (index === i && i !== 0 && i !== that.data.length - 1) {
          d.markShow = true
        } else if (i !== that.MaxandMinIndex.maxIndex && i !== that.MaxandMinIndex.minIndex) {
          d.markShow = false
        }
        if (d.markShow) {
          return that.circle.radius
        } else {
          return 0
        }
      }
      function displayD (d, i) {
        if (index === i && i !== 0 && i !== that.data.length - 1 && i !== that.MaxandMinIndex.maxIndex && i !== that.MaxandMinIndex.minIndex) {
          d.markShow = true
          d3.select(this).style('stroke-dasharray', '1000, 1000')
          .attr('d', d => d.path)
          .transition()
          .duration(500)
          .styleTween('stroke-dashoffset', function () {
            return d3.interpolateNumber(1000, 0)
          })
        } else if (i !== that.MaxandMinIndex.maxIndex && i !== that.MaxandMinIndex.minIndex) {
          d.markShow = false
          d3.select(this).style('stroke-dasharray', '1000, 1000')
          .attr('d', '')
          .transition()
          .duration(500)
          .styleTween('stroke-dashoffset', function () {
            return d3.interpolateNumber(1000, 0)
          })
        }
      }
    })
  }
  clearSvg () {
    this.svg.selectAll('*').remove()
  }
  inCircle (point, e) {
    let xr = Math.abs(e.layerX - point.x)
    let yr = Math.abs(e.layerY - point.y)
    let r = Math.sqrt(xr * xr + yr * yr)
    if (r <= this.circle.radius) {
      return true
    } else {
      return false
    }
  }
  findMaxandMinIndex () {
    let maxIndex = 0; let minIndex = 0
    if (d3.max(this.data) === 0) {
      this.MaxandMinIndex = {maxIndex: 0, minIndex: 0}
      return
    }
    let data = this.data.slice(1, this.points.length - 1)
    data.forEach((item, i) => {
      if (item > data[maxIndex]) maxIndex = i
      if (item < data[minIndex]) minIndex = i
    })
    this.MaxandMinIndex = {maxIndex: maxIndex + 1, minIndex: minIndex + 1}
  }
  linearGradient (a, b) {
    var defs = this.svg.append('defs')
    var linearGradient = defs.append('linearGradient')
    .attr('id', '__' + this.el)
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '0%')
    .attr('y2', '100%')
    linearGradient.append('stop')
    .attr('offset', '0%')
    .style('stop-color', a.toString())
    linearGradient.append('stop')
    .attr('offset', '100%')
    .style('stop-color', b.toString())
    return linearGradient
  }
  deepObjectMerge (FirstOBJ, SecondOBJ) { // 深度合并对象
    for (var key in SecondOBJ) {
      FirstOBJ[key] = FirstOBJ[key] && FirstOBJ[key].toString() === '[object Object]' ? this.deepObjectMerge(FirstOBJ[key], SecondOBJ[key]) : FirstOBJ[key] = SecondOBJ[key]
    }
    return FirstOBJ
  }
}
export default Line
