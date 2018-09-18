const getVectorLenth = (v1, v2) => {
  const [x1, y1] = v1;
  const [x2, y2] = v2;
  return (x1 * x2 + y1 * y2) / Math.sqrt(x1 * x1 + y1 * y1);
};

const getDocPosition = element => {
  let eleCom = element;
  if (typeof element === 'string') eleCom = document.querySelector(eleCom);
  let x = eleCom.offsetLeft;
  let y = eleCom.offsetTop;
  let parent = eleCom.offsetParent;

  while (parent) {
    x += parent.offsetLeft;
    y += parent.offsetTop;
    parent = parent.offsetParent;
  }

  return {
    x,
    y
  };
};

class Border {
  constructor(canvas) {
    this.canvas = canvas;
  }

  refresh(rect) {
    this.rect = rect;
    this.point = this.rect.point; // 中点

    this.c_point = [];
    this.point.reduce((a, b) => {
      this.c_point.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
      return b;
    }, this.point[3]); // 旋转点

    this.r_point = [(this.point[0][0] + this.point[1][0]) / 2, this.point[0][1] - 35];
    this.draw();
  }

  draw() {
    const {
      point,
      center,
      angle,
      width,
      height
    } = this.rect;
    const {
      context
    } = this.canvas;
    const [c_x, c_y] = center;
    const points = point;
    context.save();
    context.translate(c_x, c_y);
    context.rotate(angle);
    context.beginPath();
    context.lineWidth = '2';
    context.strokeStyle = '#73BFF9';
    context.rect(points[0][0] - c_x, points[0][1] - c_y, width, height);
    const pointList = points.concat(this.c_point);
    pointList.push(this.r_point);
    pointList.forEach(item => {
      const [x, y] = item;
      context.fillStyle = '#73BFF9';
      context.fillRect(x - 6 - c_x, y - 6 - c_y, 12, 12);
    });
    context.moveTo((points[0][0] + points[1][0]) / 2 - c_x, points[0][1] - c_y);
    context.lineTo(this.r_point[0] - c_x, this.r_point[1] - c_y);
    context.stroke();
    context.closePath();
    context.restore();
  }

  isPointInSkeletion(point) {
    let status = null;
    const [x, y] = point;
    const {
      angle
    } = this.rect;
    const r_point = this.rect.rotatePoint(this.r_point, angle);
    const d_point = this.point.map(item => this.rect.rotatePoint(item, angle));
    const c_point = this.c_point.map(item => this.rect.rotatePoint(item, angle)); // 旋转点

    (() => {
      const [c_x, c_y] = r_point;

      if (Math.sqrt(Math.pow(c_x - x, 2) + Math.pow(c_y - y, 2)) < 5) {
        status = 'r_point';
      }
    })();

    d_point.forEach((item, index) => {
      const [c_x, c_y] = item;

      if (Math.sqrt(Math.pow(c_x - x, 2) + Math.pow(c_y - y, 2)) < 5) {
        status = `point_${index + 1}`;
      }
    });
    c_point.forEach((item, index) => {
      const [c_x, c_y] = item;

      if (Math.sqrt(Math.pow(c_x - x, 2) + Math.pow(c_y - y, 2)) < 5) {
        status = `c_point_${index + 1}`;
      }
    });
    return status;
  }

}

class Rect {
  constructor(width, height, center, angle) {
    this.height = height;
    this.width = width;
    this.center = center;
    this.angle = angle;
    this.getPoint();
  } // 旋转


  rotate(angle) {
    this.angle = angle;
  } // 平移


  translate(vector) {
    const [_x, _y] = vector;
    const points = this.point.map(item => [item[0] + _x, item[1] + _y]);
    this.point = points;
    this.getCenter();
  } // 缩放


  zoom(status, vector) {
    const _x = parseFloat(vector[0]);

    const _y = parseFloat(vector[1]);

    const _angle = this.angle; // 旋转后的 x 轴相对于 canvas 的位置

    let _x_x = Math.sin(_angle + Math.PI / 2);

    let _y_x = Math.cos(_angle + Math.PI / 2); // 如果角度为 0 特殊设置，因为有些 Math.cos 不兼容


    if (_angle === 0) {
      _x_x = 1;
      _y_x = 0;
    } // 移动向量 vector 在旋转后 x 轴的距离


    const n_x = getVectorLenth([_x_x, _y_x], [_x, -_y]); // 旋转后的 y 轴相对于 canvas 的位置

    const _x_y = Math.sin(_angle) * 5;

    const _y_y = Math.cos(_angle) * 5; // 移动向量 vector 在旋转后 y 轴的距离


    const n_y = getVectorLenth([_x_y, _y_y], [_x, -_y]); // 通过正切计算出顶点的角度

    const tan = Math.atan(this.height / this.width);

    const pointZoom = _angles => {
      // 获取在第一个顶点上面的移动距离
      const n_tan = getVectorLenth([-Math.cos(_angles), Math.sin(_angles)], [_x, -_y]);
      this.width += n_tan * Math.cos(tan);
      this.height += n_tan * Math.sin(tan);
      this.center = [this.center[0] - n_tan * Math.cos(_angles) / 2, this.center[1] - n_tan * Math.sin(_angles) / 2];
    };

    if (status === 'point_1') {
      // 第1个顶点
      const _angles = tan + _angle;

      pointZoom(_angles);
    } else if (status === 'point_2') {
      // 第2个顶点
      const _angles = Math.PI - tan + _angle;

      pointZoom(_angles);
    } else if (status === 'point_3') {
      // 第3个点
      const _angles = Math.PI + tan + _angle;

      pointZoom(_angles);
    } else if (status === 'point_4') {
      // 第4个点
      const _angles = 2 * Math.PI - tan + _angle;

      pointZoom(_angles);
    } else if (status === 'c_point_1') {
      this.width -= n_x;
      this.center = [this.center[0] + n_x * Math.cos(_angle) / 2, this.center[1] + n_x * Math.sin(_angle) / 2];
    } else if (status === 'c_point_2') {
      this.height += n_y;
      this.center = [this.center[0] + n_y * Math.sin(_angle) / 2, this.center[1] - n_y * Math.cos(_angle) / 2];
    } else if (status === 'c_point_3') {
      this.width += n_x;
      this.center = [this.center[0] + n_x * Math.cos(_angle) / 2, this.center[1] + n_x * Math.sin(_angle) / 2];
    } else if (status === 'c_point_4') {
      this.height -= n_y;
      this.center = [this.center[0] + n_y * Math.sin(_angle) / 2, this.center[1] - n_y * Math.cos(_angle) / 2];
    }

    this.getPoint();
    this.setWH();
  } // 确定定是否内部


  isPointInRect(point) {
    // 旋转后的位置
    const points = this.point.map(item => this.rotatePoint(item, this.angle));
    const p1 = points[0];
    const p2 = points[1];
    const p3 = points[2];
    const p4 = points[3];
    const x = point[0];
    const y = -point[1]; // 是否在两个平行线内

    const ratio1 = function () {
      const a = (p1[1] - p2[1]) / (p2[0] - p1[0]);
      const b = -p1[1] - a * p1[0];
      const c = -p3[1] - a * p3[0];
      if (b > c && a * x + b > y && a * x + c < y) return true;
      if (b < c && a * x + b < y && a * x + c > y) return true;
      return false;
    }(); // 是否在两个平行线内


    const ratio2 = function () {
      const a = (p2[1] - p3[1]) / (p3[0] - p2[0]);
      const b = -p2[1] - a * p2[0];
      const c = -p4[1] - a * p4[0];

      if (p3[0] - p2[0] === 0) {
        if (p1[0] < x && x < p2[0] || p1[0] > x && x > p2[0]) return true;
      }

      if (b > c && a * x + b > y && a * x + c < y) return true;
      if (b < c && a * x + b < y && a * x + c > y) return true;
      return false;
    }();

    if (ratio1 && ratio2) return true;
    return false;
  } // 获取中点


  getCenter() {
    const p1 = this.point[0];
    const p3 = this.point[2];
    const x = p1[0] + p3[0];
    const y = p1[1] + p3[1];
    this.center = [x / 2, y / 2];
  } // 某点绕重点旋转角度


  rotatePoint(point, angle) {
    const [x, y] = point;
    const [c_x, c_y] = this.center;

    const _x = (x - c_x) * Math.cos(angle) - (y - c_y) * Math.sin(angle) + c_x;

    const _y = (x - c_x) * Math.sin(angle) + (y - c_y) * Math.cos(angle) + c_y;

    return [_x, _y];
  } // 通过宽高和中点获取四个点


  getPoint() {
    const h = this.height;
    const w = this.width;
    const [c_x, c_y] = this.center;
    const points = [];
    points[0] = [c_x - w / 2, c_y - h / 2];
    points[1] = [c_x + w / 2, c_y - h / 2];
    points[2] = [c_x + w / 2, c_y + h / 2];
    points[3] = [c_x - w / 2, c_y + h / 2];
    this.point = points;
  }

  setWH() {
    this.height = Math.abs(this.point[0][1] - this.point[3][1]);
    this.width = Math.abs(this.point[0][0] - this.point[1][0]);
  }

}

class Photo {
  constructor(image, canvas, load) {
    this.canvas = canvas;
    this.img = image;
    this.load = load;
    this.id = new Date().getTime();
    this.isLoad = false;

    if (image.rect) {
      this.options = image;
      this.img = this.options.img;
      this.id = this.options.id;
    }

    this.pre();
  }

  pre() {
    if (typeof this.img !== 'string') {
      this.image = this.img;
      this.isLoad = true;
      this.init();
    } else {
      this.image = new Image();

      this.image.onload = () => {
        if (this.isLoad) return;
        this.isLoad = true;
        this.init();
      };

      this.image.src = this.img;

      if (this.image.complete) {
        this.isLoad = true;
        this.init();
      }
    }
  }

  init() {
    if (this.load) this.load();

    if (this.options) {
      const {
        width,
        height,
        center,
        angle
      } = this.options.rect;
      this.rect = new Rect(width, height, [center[0], center[1]], angle);
      return;
    }

    this.rect = new Rect(this.image.width, this.image.height, [this.canvas.width / 2, this.canvas.height / 2], 0);
  }

  draw() {
    const {
      image,
      canvas,
      rect
    } = this;
    const {
      context
    } = canvas;
    const points = rect.point;
    const [c_x, c_y] = rect.center;
    context.save();
    context.translate(c_x, c_y);
    context.rotate(rect.angle);
    context.drawImage(image, 0, 0, image.width, image.height, points[0][0] - c_x, points[0][1] - c_y, rect.width, rect.height);
    context.restore();
  }

}

class Canvas {
  constructor(options) {
    this.options = options;
    const {
      canvas,
      height,
      width,
      target,
      before,
      after,
      data = [],
      list = null
    } = this.options;
    this.canvas = null; // 画布

    this.height = height; // 画布的宽高

    this.width = width;
    this.target = target;
    this.before = before;
    this.after = after;
    this.data = data;
    this.layers = []; // 画布的层

    if (typeof canvas === 'string') {
      this.canvas = document.getElementById(canvas);
    } else {
      this.canvas = canvas;
    }

    if (typeof target === 'string') {
      this.target = document.getElementById(target);
    } else {
      this.target = target;
    }

    if (typeof list === 'string') {
      this.list = document.getElementById(list);
    } else {
      this.list = list;
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext('2d'); // 画布对象

    this.loaded = 0;
    this.border = new Border(this);
    this.current = null;
    this.init();
    this.initEvent();
  }

  init() {
    this.clear();
    if (this.before) this.before(this);

    const add = image => {
      this.loaded += 1;
      const lyr = new Photo(image, this, () => {
        setTimeout(() => {
          this.loaded -= 1;

          if (this.loaded < 1) {
            this.draw();
          }
        }, 100);
      });
      this.layers.push(lyr);
      this.addItem(image.img, lyr.id);
    };

    this.data.forEach(item => {
      if (typeof item !== 'function') {
        add(item);
      }
    });
    if (this.after) this.after(this);
  }

  initEvent() {
    this.target.addEventListener('mousedown', e => {
      let p_x = e.pageX;
      let p_y = e.pageY;
      const position = getDocPosition(this.target);
      const scale = this.width / this.target.offsetWidth;
      const point = [(p_x - position.x) * scale, (p_y - position.y) * scale];
      const status = this.selectPhoto(point);

      if (status) {
        const move = event => {
          const m_x = event.pageX;
          const m_y = event.pageY;
          const vector = [(m_x - p_x) * scale, (m_y - p_y) * scale];

          if (status === 1) {
            this.current.rect.translate(vector);
          } else if (status === 'r_point') {
            const e_point = [(m_x - position.x) * scale, (m_y - position.y) * scale];
            const angle = Canvas.getAngle(this.current.rect.center, this.border.r_point, e_point);

            if (!isNaN(angle)) {
              this.current.rect.rotate(angle);
            } else {
              return;
            }
          } else {
            this.current.rect.zoom(status, vector);
          }

          this.draw();
          p_x = m_x;
          p_y = m_y;
        };

        this.target.addEventListener('mousemove', move);
        this.target.addEventListener('mouseup', () => {
          this.target.removeEventListener('mousemove', move);
        });
      }
    });
    this.list.addEventListener('click', e => {
      if (e.target && e.target.nodeName.toUpperCase() === 'IMG') {
        const id = parseInt(e.target.getAttribute('data-id'));
        this.layers.forEach((item, index) => {
          if (item.id === id) {
            this.chooseItem(index);
          }
        });
      }
    });
  } // 旋转角度


  static getAngle(cen, first, second) {
    const f_c_x = first[0] - cen[0];
    const f_c_y = cen[1] - first[1];
    const s_c_x = second[0] - cen[0];
    const s_c_y = cen[1] - second[1];
    const c = Math.sqrt(f_c_x * f_c_x + f_c_y * f_c_y) * Math.sqrt(s_c_x * s_c_x + s_c_y * s_c_y);
    if (c === 0) return -1;
    const angle = Math.acos((f_c_x * s_c_x + f_c_y * s_c_y) / c); // 第一象限

    if (cen[0] - second[0] < 0 && cen[1] - second[1] < 0) {
      return angle; // 第二象限
    }

    if (cen[0] - second[0] < 0 && cen[1] - second[1] > 0) {
      return angle; // 第三象限
    }

    if (cen[0] - second[0] > 0 && cen[1] - second[1] < 0) {
      return 2 * Math.PI - angle; // 第四象限
    }

    if (cen[0] - second[0] > 0 && cen[1] - second[1] > 0) {
      return 2 * Math.PI - angle;
    }

    return null;
  }

  addCommand(command) {
    this.layers.push(command);

    if (this.loaded > 0) {
      setTimeout(() => {
        this.draw();
      }, 100);
      return;
    }

    this.draw();
  } // 添加图片


  addPhoto(image) {
    if (typeof image === 'string') {
      this.loaded += 1;
      const lyr = new Photo(image, this, () => {
        setTimeout(() => {
          this.loaded -= 1;

          if (this.loaded < 1) {
            this.draw();
          }
        }, 100);
      });
      this.layers.push(lyr);
      this.addItem(image, lyr.id);
    } else {
      const lyr = new Photo(image, this);
      this.layers.push(lyr);
      this.addItem(image, lyr.id);
      this.draw();
    }
  }

  addItem(image, id) {
    const item = document.createElement('div');
    item.classList.add('item');
    let img = image;

    if (typeof image === 'string') {
      img = new Image();
      img.src = image;
    }

    img.setAttribute('data-id', id);
    item.appendChild(img);
    this.list.appendChild(item);
  }

  selectPhoto(point) {
    if (this.current) {
      const status = this.border.isPointInSkeletion(point);

      if (status) {
        return status;
      }
    }

    const layers = [].concat(this.layers).reverse();
    this.current = null;
    let c_index = 0;
    layers.forEach((item, index) => {
      if (typeof item !== 'function' && !this.current && item.rect.isPointInRect(point)) {
        this.current = item;
        c_index = index + 1;
      }
    });

    if (this.current) {
      this.chooseItem(this.layers.length - c_index);
      return 1;
    }

    return 0;
  }

  chooseItem(index) {
    this.current = this.layers[index];
    this.layers.splice(index, 1);
    this.layers.push(this.current);
    this.draw();
  }

  clear() {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  save() {
    const data = this.layers.map(item => {
      const {
        rect,
        id,
        img
      } = item;
      return {
        rect,
        id,
        img
      };
    });
    return data;
  }

  draw() {
    this.clear();
    this.layers.forEach(item => {
      if (typeof item === 'function') {
        item.apply(null, this.context, this.canvas);
      } else {
        item.draw();
      }
    });

    if (this.current) {
      this.border.refresh(this.current.rect);
    }
  }

}

const dataCa = sessionStorage.getItem('test_tst_111');
const canvas = new Canvas({
  canvas: 'test',
  target: 'test',
  list: 'list',
  height: 960,
  width: 960,
  data: dataCa ? JSON.parse(dataCa) : []
});
document.getElementById('save').addEventListener('click', () => {
  sessionStorage.setItem('test_tst_111', JSON.stringify(canvas.save()));
});
document.addEventListener(); // canvas.addPhoto('https://cdn.eoniq.co/spree/images/283205/desktop/CI-26-LS_b6bb28a3914ae9caa651abbddb548054.jpg?1533196945');
// canvas.addPhoto('http://www.runoob.com/wp-content/uploads/2013/11/img_the_scream.jpg');
