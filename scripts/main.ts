window.addEventListener("load", () => new Demo());


class Demo {
    private canvas : HTMLCanvasElement;
    private ctx : CanvasRenderingContext2D;

    private size : number;
    private X : number[];
    private Y : number[];
    private heldID : number;

    private spline : CubicSpline2D;

    constructor() {
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.ctx = this.canvas.getContext("2d");
        this.addMouseEvents();

        this.size = 8;
        this.X = new Array(this.size);
        this.Y = new Array(this.size);
        this.heldID = -1;

        for (let i = 0; i < this.size; i++) {
            this.X[i] = this.canvas.width*((i+0.5)/this.size);
            this.Y[i] = this.canvas.height*Math.random();
        }

        this.spline = new CubicSpline2D(this.X, this.Y);
        this.drawFrame();

        this.step();
    }

    step() {
        
        
        window.requestAnimationFrame(() => this.step());
    }

    handleMouseDown(x : number, y : number) {
        for (let i = 0; i < this.size; i++) {
            if (this.X[i]-8 < x && x < this.X[i]+8 && 
                this.Y[i]-8 < y && y < this.Y[i]+8)  {
                    this.heldID = i;
            }
        }
    }

    handleMouseMove(x : number, y : number) {
        if (this.heldID != -1) {
            this.X[this.heldID] = x;
            this.Y[this.heldID] = y;

            this.spline.update();
            this.drawFrame();
        }
    }

    handleMouseUp() {
        this.heldID = -1;
    }

    addMouseEvents() {
        this.canvas.addEventListener("mousedown", (event) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            this.handleMouseDown(x, y);
        })
        this.canvas.addEventListener("mousemove", (event) => {
            const rect = this.canvas.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top
            this.handleMouseMove(x, y);
        })
        this.canvas.addEventListener("mouseup", () => this.handleMouseUp());
    }

    drawFrame() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.spline.xEval(-10), this.spline.yEval(-10));
        for (let i = 0; i <= 200; i++) {
            this.ctx.lineTo(this.spline.xEval(i/200), this.spline.yEval(i/200));
        }
        this.ctx.lineTo(this.spline.xEval(11), this.spline.yEval(11));
        this.ctx.stroke();

        for (let i = 0; i < this.size; i++) {
            this.ctx.fillRect(this.X[i]-4, this.Y[i]-4, 8, 8);
        }
    }
}

class CubicSpline2D {
    private N : number;
    private X : number[];
    private Y : number[];
    private T : number[];

    private xSpline : CubicSpline;
    private ySpline : CubicSpline;

    constructor(X : number[], Y : number[]) {
        this.X = X;
        this.Y = Y;
        this.N = this.X.length - 1;
        this.T = new Array(this.N+1)
        this.calcKnots();

        this.xSpline = new CubicSpline(this.T, this.X);
        this.ySpline = new CubicSpline(this.T, this.Y);
    }

    calcKnots() {
        this.T[0] = 0;
        for (let i = 1; i < this.N+1; i++) {
            this.T[i] = this.T[i-1] + Math.sqrt((this.X[i] - this.X[i-1])**2 + (this.Y[i] - this.Y[i-1])**2);
        }
        for (let i = 1; i < this.N+1; i++) {
            this.T[i] = this.T[i]/this.T[this.N];
        }
    }

    update() {
        this.calcKnots();
        this.xSpline.calcCoef();
        this.ySpline.calcCoef();
    }

    xEval(t) {
        return this.xSpline.eval(t);
    }

    yEval(t) {
        return this.ySpline.eval(t);
    }
}

class CubicSpline {
    private N : number;
    private T : number[];
    private F : number[];

    private A : number[];
    private B : number[];
    private C : number[];
    private D : number[];

    constructor(T : number[], F : number[]) {
        this.N = T.length - 1;
        this.T = T;
        this.F = F;

        this.A = new Array(this.N);
        this.B = new Array(this.N);
        this.C = new Array(this.N);
        this.D = new Array(this.N);

        this.calcCoef();
    }

    calcCoef() {
        let H = new Array(this.N);
        let G = new Array(this.N);
        let U = new Array(this.N);
        let E = new Array(this.N);
        let Z = new Array(this.N+1);

        for (let i = 0; i < this.N; i++) {
            H[i] = this.T[i+1] - this.T[i];
            G[i] = 6*(this.F[i+1] - this.F[i])/H[i];
        }

        U[1] = 2*(H[1] + H[0]);
        E[1] = G[1] - G[0];

        for (let i = 2; i < this.N; i++) {
            U[i] = 2*(H[i] + H[i-1]) - H[i-1]**2 / U[i-1];
            E[i] = G[i] - G[i-1] - E[i-1] * H[i-1] / U[i-1];
        }

        Z[0] = 0;
        Z[this.N] = 0;
        for (let i = this.N-1; i > 0; i--) {
            Z[i] = (E[i] - H[i]*Z[i+1]) / U[i];
        }

        for (let i = 0; i < this.N; i++) {
            this.A[i] = (Z[i+1] - Z[i]) / (6*H[i]);
            this.B[i] = Z[i]/2;
            this.C[i] = (this.F[i+1] - this.F[i])/H[i] - H[i]*(Z[i+1] + 2*Z[i])/6;
            this.D[i] = this.F[i];   
        }
    }

    eval(t : number) {
        for (let i = 0; i < this.N; i++) {
            if (this.T[i] <= t && t <= this.T[i+1]) {
                return this.funcEval(i, t);
            }
        }

        if (t < 0) {
            return t*this.C[0] + this.D[0];
        } else if (1 < t) {
            return (t-this.T[this.N-1])*this.derivEval(this.N-1, 1) + this.funcEval(this.N-1, 1);
        }
    }

    funcEval(i : number, t : number) {
        let tRel = t - this.T[i];
        return this.D[i] + tRel*(this.C[i] + tRel*(this.B[i] + tRel*this.A[i]));
    }

    derivEval(i : number, t : number) {
        let tRel = t - this.T[i];
        return this.C[i] + tRel*(2*this.B[i] + tRel*3*this.A[i]);
    }
}