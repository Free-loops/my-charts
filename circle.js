import * as d3 from 'd3'

class Circle {
  constructor (config) {
    let defaultConfig = {
      radius: 25 / 100,
      circle: {
        stroke: '#f5f5f6',
        strokeWidth: 2
      },
      timeout: 0,
      grade: [{color: '#21C887', value: 100}, {color: '#FDAA58', value: 90}, {color: '#EB4443', value: 60}], // 数据临界点
      data: 60
    }
    Object.assign(this, this.deepObjectMerge(defaultConfig, config))
    this.svg = d3.select(config.el)
    this.svg.attr('height', this.svg._groups[0][0].parentElement.clientHeight)
    this.height = this.svg._groups[0][0].clientHeight
    this.width = this.svg._groups[0][0].clientWidth
    this.plottingScale = null
  }
  init () {
    setTimeout(() => {
      this.clearSvg()
      this.getColor()
      this.setPlottingScale()
      this.drawCircle()
      this.drawArc()
      this.drawIcon()
    }, this.timeout)
  }
  setPlottingScale () {
    this.plottingScale = d3.scaleLinear().range([0, Math.PI * 2]).domain([0, 100])
  }
  drawCircle () {
    this.svg.append('circle')
    .attr('class', 'bgcircle')
    .attr('r', this.radius * this.height)
    .attr('cx', this.width / 2)
    .attr('cy', this.height / 2)
    .attr('stroke', this.circle.stroke)
    .attr('fill', '#fff')
    .attr('stroke-width', this.circle.strokeWidth)
  }
  drawArc () {
    var radialLine = d3.radialLine()
    .angle((d) => {
      return d[1]
    })
    .radius((d) => {
      return d[0]
    })
    var points = []
    for (let index = 0; index <= 500; index++) {
      if (this.plottingScale(this.data) === 0) break
      let r = this.radius * this.height
      let angle = index / 250 * Math.PI
      if (angle > this.plottingScale(this.data)) break
      points.push([r, angle])
    }
    var path = radialLine(points)
    this.svg.append('path')
    .attr('class', 'status-circle')
    .attr('d', path)
    .attr('stroke', this.grade[this.gradeIndex].color)
    .attr('fill', '#fff')
    .attr('stroke-linecap', () => {
      if (this.data < 100) {
        return 'round'
      } else {
        return 'none'
      }
    })
    .attr('stroke-width', this.circle.strokeWidth)
    .attr('transform', 'translate(' + this.width / 2 + ', ' + this.height / 2 + ')')
    .style('stroke-dasharray', '1000, 1000')
    .transition()
    .duration(1000)
    .styleTween('stroke-dashoffset', function () {
      return d3.interpolateNumber(1000, 0)
    })
  }
  drawIcon () {
    // 电击 叹号 对号
    let path = [
      'M994.048 166.249813c-39.936-40.9088-104.680107-40.9088-144.616107 0L391.48544 635.470507 174.564693 413.218133c-39.936-40.925867-104.680107-40.925867-144.605866 0-39.94624 40.905387-39.94624 107.250347 0 148.1728l289.221973 296.3456c39.936 40.925867 104.676693 40.925867 144.612693 0L994.048 314.426027c39.936-40.91904 39.936-107.25376 0-148.176214z m0 0',
      'M603.19744 1024h-182.398293c-10.943147 0-19.89632-8.953173-19.89632-19.89632V335.633067c0-10.943147 8.953173-19.89632 19.89632-19.89632h182.398293c10.943147 0 19.89632 8.953173 19.89632 19.89632v668.470613c0 10.943147-8.953173 19.89632-19.89632 19.89632zM512 234.594987c-64.535893 0-117.34016-52.800853-117.34016-117.34016v0.08192C394.65984 52.800853 447.464107 0 512 0c64.535893 0 117.34016 52.800853 117.34016 117.34016v-0.08192c0 64.535893-52.804267 117.336747-117.34016 117.336747z',
      'M166.106453 574.53568l355.66592 7.816533L447.511893 1024l410.381654-582.352213h-340.02944L596.02944 0z'
    ]
    this.svg.append('path')
    .attr('class', 'status-icon')
    .attr('d', path[this.gradeIndex])
    .attr('fill', this.grade[this.gradeIndex].color)
    .attr('transform', 'translate(-' + (this.height * 0.14) + ', -' + (this.height * 0.13) + ') scale(' + 0.0003 * this.height + ')')
    .attr('transform-origin', 'center')
  }
  clearSvg () {
    this.svg.selectAll('*').remove()
  }
  getColor () {
    let grade = 0
    this.grade.forEach((item, i) => {
      if (this.data < item.value) {
        grade = i
      }
    })
    this.gradeIndex = grade
  }
  deepObjectMerge (FirstOBJ, SecondOBJ) { // 深度合并对象
    for (var key in SecondOBJ) {
      FirstOBJ[key] = FirstOBJ[key] && FirstOBJ[key].toString() === '[object Object]' ? this.deepObjectMerge(FirstOBJ[key], SecondOBJ[key]) : FirstOBJ[key] = SecondOBJ[key]
    }
    return FirstOBJ
  }
}

export default Circle
