window.addEventListener("load", function () { return new Demo(); });
var Demo = /** @class */ (function () {
    function Demo() {
        this.canvas = document.getElementById("canvas");
        this.ctx = this.canvas.getContext("2d");
        this.addMouseEvents();
        this.size = 8;
        this.X = new Array(this.size);
        this.Y = new Array(this.size);
        this.heldID = -1;
        for (var i = 0; i < this.size; i++) {
            this.X[i] = this.canvas.width * ((i + 0.5) / this.size);
            this.Y[i] = this.canvas.height * Math.random();
        }
        this.spline = new CubicSpline2D(this.X, this.Y);
        this.drawFrame();
        this.step();
    }
    Demo.prototype.step = function () {
        var _this = this;
        window.requestAnimationFrame(function () { return _this.step(); });
    };
    Demo.prototype.handleMouseDown = function (x, y) {
        for (var i = 0; i < this.size; i++) {
            if (this.X[i] - 8 < x && x < this.X[i] + 8 &&
                this.Y[i] - 8 < y && y < this.Y[i] + 8) {
                this.heldID = i;
            }
        }
    };
    Demo.prototype.handleMouseMove = function (x, y) {
        if (this.heldID != -1) {
            this.X[this.heldID] = x;
            this.Y[this.heldID] = y;
            this.spline.update();
            this.drawFrame();
        }
    };
    Demo.prototype.handleMouseUp = function () {
        this.heldID = -1;
    };
    Demo.prototype.addMouseEvents = function () {
        var _this = this;
        this.canvas.addEventListener("mousedown", function (event) {
            var rect = _this.canvas.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            _this.handleMouseDown(x, y);
        });
        this.canvas.addEventListener("mousemove", function (event) {
            var rect = _this.canvas.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            _this.handleMouseMove(x, y);
        });
        this.canvas.addEventListener("mouseup", function () { return _this.handleMouseUp(); });
    };
    Demo.prototype.drawFrame = function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
        this.ctx.moveTo(this.spline.xEval(-10), this.spline.yEval(-10));
        for (var i = 0; i <= 200; i++) {
            this.ctx.lineTo(this.spline.xEval(i / 200), this.spline.yEval(i / 200));
        }
        this.ctx.lineTo(this.spline.xEval(11), this.spline.yEval(11));
        this.ctx.stroke();
        for (var i = 0; i < this.size; i++) {
            this.ctx.fillRect(this.X[i] - 4, this.Y[i] - 4, 8, 8);
        }
    };
    return Demo;
}());
var CubicSpline2D = /** @class */ (function () {
    function CubicSpline2D(X, Y) {
        this.X = X;
        this.Y = Y;
        this.N = this.X.length - 1;
        this.T = new Array(this.N + 1);
        this.calcKnots();
        this.xSpline = new CubicSpline(this.T, this.X);
        this.ySpline = new CubicSpline(this.T, this.Y);
    }
    CubicSpline2D.prototype.calcKnots = function () {
        this.T[0] = 0;
        for (var i = 1; i < this.N + 1; i++) {
            this.T[i] = this.T[i - 1] + Math.sqrt(Math.pow((this.X[i] - this.X[i - 1]), 2) + Math.pow((this.Y[i] - this.Y[i - 1]), 2));
        }
        for (var i = 1; i < this.N + 1; i++) {
            this.T[i] = this.T[i] / this.T[this.N];
        }
    };
    CubicSpline2D.prototype.update = function () {
        this.calcKnots();
        this.xSpline.calcCoef();
        this.ySpline.calcCoef();
    };
    CubicSpline2D.prototype.xEval = function (t) {
        return this.xSpline.eval(t);
    };
    CubicSpline2D.prototype.yEval = function (t) {
        return this.ySpline.eval(t);
    };
    return CubicSpline2D;
}());
var CubicSpline = /** @class */ (function () {
    function CubicSpline(T, F) {
        this.N = T.length - 1;
        this.T = T;
        this.F = F;
        this.A = new Array(this.N);
        this.B = new Array(this.N);
        this.C = new Array(this.N);
        this.D = new Array(this.N);
        this.calcCoef();
    }
    CubicSpline.prototype.calcCoef = function () {
        var H = new Array(this.N);
        var G = new Array(this.N);
        var U = new Array(this.N);
        var E = new Array(this.N);
        var Z = new Array(this.N + 1);
        for (var i = 0; i < this.N; i++) {
            H[i] = this.T[i + 1] - this.T[i];
            G[i] = 6 * (this.F[i + 1] - this.F[i]) / H[i];
        }
        U[1] = 2 * (H[1] + H[0]);
        E[1] = G[1] - G[0];
        for (var i = 2; i < this.N; i++) {
            U[i] = 2 * (H[i] + H[i - 1]) - Math.pow(H[i - 1], 2) / U[i - 1];
            E[i] = G[i] - G[i - 1] - E[i - 1] * H[i - 1] / U[i - 1];
        }
        Z[0] = 0;
        Z[this.N] = 0;
        for (var i = this.N - 1; i > 0; i--) {
            Z[i] = (E[i] - H[i] * Z[i + 1]) / U[i];
        }
        for (var i = 0; i < this.N; i++) {
            this.A[i] = (Z[i + 1] - Z[i]) / (6 * H[i]);
            this.B[i] = Z[i] / 2;
            this.C[i] = (this.F[i + 1] - this.F[i]) / H[i] - H[i] * (Z[i + 1] + 2 * Z[i]) / 6;
            this.D[i] = this.F[i];
        }
    };
    CubicSpline.prototype.eval = function (t) {
        for (var i = 0; i < this.N; i++) {
            if (this.T[i] <= t && t <= this.T[i + 1]) {
                return this.funcEval(i, t);
            }
        }
        if (t < 0) {
            return t * this.C[0] + this.D[0];
        }
        else if (1 < t) {
            return (t - this.T[this.N - 1]) * this.derivEval(this.N - 1, 1) + this.funcEval(this.N - 1, 1);
        }
    };
    CubicSpline.prototype.funcEval = function (i, t) {
        var tRel = t - this.T[i];
        return this.D[i] + tRel * (this.C[i] + tRel * (this.B[i] + tRel * this.A[i]));
    };
    CubicSpline.prototype.derivEval = function (i, t) {
        var tRel = t - this.T[i];
        return this.C[i] + tRel * (2 * this.B[i] + tRel * 3 * this.A[i]);
    };
    return CubicSpline;
}());
