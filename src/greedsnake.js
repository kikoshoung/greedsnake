(function() {
    var defaults = {
        width: 300, //canvas
        height: 300,
        gridWidth: 10,
        gridHeight: 10,
        dir: 3, //0, 1, 2, 3: up, right, down, left
        snakeLen: 3,
        freq: 120, //ms
        onscore: function() {},
        onfail: function() {
            alert('Come on, try to get a higher score!')
        }
    }

    var Greedsnake = function(options) {
        this.options = options;
        this.init();
    }

    Greedsnake.prototype = {
        init: function() {
            if (checkSupport(this.options)) {
                this.initCanvas();
                this.initSnake();
                this.initFood();
                this.drawFrame();
                this.bindEvents();
                this.paused = false;
            };
        },
        start: function() {
            this.initTimer();
        },
        restart: function() {
            clearTimeout(this.timer);
            this.timer = null;
            this.over = false;
            this.init();
            this.start();
        },
        initCanvas: function() {
            var options = this.options;

            options.canvas.width = options.width || defaults.width;
            options.canvas.height = options.height || defaults.height;
            this.canvas = options.canvas;
            this.canvasWidth = this.canvas.width;
            this.canvasHeight = this.canvas.height;
            this.gridWidth = options.gridWidth || defaults.gridWidth;
            this.gridHeight = options.gridHeight || defaults.gridHeight;
            this.canvasXLen = this.canvasWidth / this.gridWidth;
            this.canvasYLen = this.canvasHeight / this.gridHeight;
            this.defaultSnakeLen = options.snakeLen || defaults.snakeLen;
            this.freq = defaults.freq;
            this.ctx = this.canvas.getContext('2d');
            this.onscore = options.onscore || defaults.onscore;
            this.onfail = options.onfail || defaults.onfail;
        },
        initSnake: function(snakeNodes) {
            this.snakeNodes = this.getDefaultNodes();
        },
        initFood: function(foodNode) {
            this.foodNode = this.getFoodNode();
        },
        initTimer: function() {
            if (this.timer || this.over) return;
            var self = this;

            this.timer = setTimeout(function() {
                self.timer = setTimeout(arguments.callee, self.freq);
                self.freq = defaults.freq;
                self.calcNextFrame();
                self.drawFrame();

            }, this.freq)
        },
        bindEvents: function() {
            var self = this;

            window.addEventListener('keyup', function(e) {
                self.keyupHandler(e);
                return false;
            });
        },
        keyupHandler: function(e) {
            var snakeHead = this.snakeNodes[0],
                headDir = snakeHead.dir;

            e.stopPropagation();
            switch (e.keyCode) {
                case 10000:
                    this.freq = this.freq /= 3;
                    break;
                case 38:
                    if (headDir != 2) snakeHead.dir = 0;
                    break;
                case 39:
                    if (headDir != 3) snakeHead.dir = 1;
                    break;
                case 40:
                    if (headDir != 0) snakeHead.dir = 2;
                    break;
                case 37:
                    if (headDir != 1) snakeHead.dir = 3;
                    break;
                case 32:
                    this.togglePause();
                    break;
            }
        },
        getDefaultNodes: function() {
            var canvas = this.canvas,
                snake = this.snake,
                snakeLen = this.options.snakeLen || defaults.snakeLen,
                canvasWidth = this.canvasWidth,
                canvasHeight = this.canvasHeight,
                gridWidth = this.gridWidth,
                gridHeight = this.gridHeight,
                dir = defaults.dir,
                ret = [];

            for (var i = 0; i < snakeLen; i++) {
                ret.push({
                    dir: dir,
                    x: Math.floor(canvasWidth / gridWidth / 2) + i,
                    y: Math.floor(canvasWidth / gridWidth / 2)
                });
            }
            return ret;
        },
        getFoodNode: function() {
            var emptyGrids = this.getEmptyGrids(),
                r = this.getRandomNum(emptyGrids.length);
            return emptyGrids[r];
        },
        getEmptyGrids: function() {
            var options = this.options,
                canvasWidth = this.canvas.width,
                canvasXLen = this.canvasXLen,
                canvasYLen = this.canvasYLen,
                snakeNodes = this.snakeNodes,
                snakeLen = snakeNodes.length,
                snakeNodesObj = {},
                ret = [];

            for (var i = 0; i < snakeLen; i++) {
                var curVal = snakeNodes[i].x + '-' + snakeNodes[i].y;
                snakeNodesObj[curVal] = curVal;
            }
            for (var j = 0; j < canvasXLen; j++) {
                for (var k = 0; k < canvasYLen; k++) {
                    if (!snakeNodesObj[j + '-' + k]) {
                        ret.push({
                            x: j,
                            y: k
                        });
                    }
                }
            }
            return ret;
        },
        getRandomNum: function(range) {
            return Math.floor(Math.random() * range);
        },
        calcNextFrame: function() {
            this.calcNextSnake();
            this.calcNextFood();
        },
        calcNextSnake: function() {
            var options = this.options,
                nodes = this.snakeNodes,
                foodNode = this.foodNode,
                len = nodes.length,
                curNode,
                curDir,
                prevNode,
                addedNode;

            for (var i = len - 1; i >= 0; i--) {
                curNode = nodes[i];
                prevNode = nodes[i - 1];

                switch (curNode.dir) {
                    case 0:
                        curNode.y--;
                        break;
                    case 1:
                        curNode.x++;
                        break;
                    case 2:
                        curNode.y++;
                        break;
                    case 3:
                        curNode.x--;
                        break;
                }
                if (prevNode) {
                    curNode.dir = prevNode.dir;
                }
            }
            if (nodes[0].x == foodNode.x && nodes[0].y == foodNode.y) {
                this.addNode();
                this.foodNode = null;
                this.onscore && this.onscore(this.snakeNodes.length - this.defaultSnakeLen);
            }
            if (this.isHit() || this.isSuicide()) {
                this.over = true;
                this.addNode();
                this.onfail && this.onfail();
                this.togglePause();
            }
        },
        calcNextFood: function() {
            if (!this.foodNode) {
                this.foodNode = this.getFoodNode();
            }
        },
        isHit: function() {
            var nodes = this.snakeNodes;

            return nodes[0].x < 0 || nodes[0].x >= this.canvasXLen || nodes[0].y < 0 || nodes[0].y >= this.canvasYLen;
        },
        isSuicide: function() {
            var nodes = this.snakeNodes,
                head = nodes[0],
                len = nodes.length;

            for (var i = 1; i < len; i++) {
                if (head.x == nodes[i].x && head.y == nodes[i].y) return true;
            }

            return false;
        },
        togglePause: function() {
            var options = this.options;

            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
                options.onpause && options.onpause();
            } else {
                this.initTimer();
                options.onstart && options.onstart();
            }
        },
        drawFrame: function() {
            this.clearCanvas();
            this.drawSnake();
            this.drawFood();
            this.options.ondraw && this.options.ondraw();
        },
        addNode: function() {
            var nodes = this.snakeNodes,
                rear = nodes[nodes.length - 1],
                addedNode = {
                    dir: rear.dir,
                    x: rear.x,
                    y: rear.y
                };

            switch (rear.dir) {
                case 0:
                    addedNode.y++;
                    break;
                case 1:
                    addedNode.x--;
                    break;
                case 2:
                    addedNode.y--;
                    break;
                case 3:
                    addedNode.x++;
                    break;
            }
            this.snakeNodes.push(addedNode);
        },
        drawSnake: function() {
            var nodes = this.snakeNodes,
                len = nodes.length,
                gridWidth = this.gridWidth,
                gridHeight = this.gridHeight;

            for (var i = 0; i < len; i++) {
                this.ctx.fillRect(nodes[i].x * gridWidth, nodes[i].y * gridHeight, gridWidth, gridHeight);
            }
        },
        drawFood: function() {
            var node = this.foodNode,
                gridWidth = this.gridWidth,
                gridHeight = this.gridHeight;

            this.ctx.fillRect(node.x * gridWidth, node.y * gridHeight, gridWidth, gridHeight);
        },
        clearCanvas: function() {
            this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
    }

    function checkSupport(options) {
        if (!options.canvas) {
            throw new Error('Missing param canvas.');
            return false;
        }
        if (!options.canvas.getContext('2d')) {
            return false;
        };
        return true;
    }

    window.Greedsnake = Greedsnake;
})();
