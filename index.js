'use strict';
//window.onload = function() {}
class Path extends Array {
    constructor() {
        super(0);
        this.push.apply(this, arguments);
    }

    get copy(){return this.slice();}
    get value(){return this.valueOf();}
    get string(){return JSON.stringify(this);}
    
    // static compare(path1, path2){
    //     if(path1.length != path2.length) return null;
    //     for(var i = 0; i < path1.length; i++) {
    //         if(path1[i] < path2[i]) return 1;
    //         else if(path1[i] > path2[i]) return -1;
    //     }
    //     return 0;
    // }
    // static equal(path1, path2){
    //     return Path.compare(path1, path2) == 0;
    // }
    valueOf(){
        var primitiveValue = 0;
        for(var i=0; i<this.length; i++)
            primitiveValue += this[i] * Math.pow(AccClassNode.maximumChildrenCnt+1, this.length-i-1);
        return primitiveValue;
    }

    static parse(string) {
        var newPath = new Path();
        newPath.push.apply(newPath, JSON.parse(string));
        return newPath;
    }
}

class AccNode{
    constructor(){
        this._parentNode = null;
    }
    get nodeType() {return 'null';}
    get parent() {return this._parentNode;}
    set parent(newParentNode) {this._parentNode = newParentNode;}//currently parent is only updated at AccClassNode.insert
    get path() {
        if(this._parentNode) {
            var idxOfThis = this._parentNode.children.indexOf(this);
            return this._parentNode.path.concat(idxOfThis);
        }else{//root node
            return [0];
        }
    }

    isItem() {return this.nodeType.localeCompare('item') == 0;}
    isClass() {return this.nodeType.localeCompare('class') == 0;}
}

class AccItemNode extends AccNode{
    constructor(givenData={}){
        super();
        Object.assign(this, givenData);
    }
    get nodeType() {return 'item';}
}

class AccClassNode extends AccNode{
    constructor(givenName='', givenChildNodes=[]){
        super();
        this._childNodes = givenChildNodes;
        this._name = givenName;
    }

    get nodeType() {return 'class';}
    get name(){return this._name;}
    set name(newName){this._name = newName;}
    get children(){return this._childNodes;}
    static get maximumChildrenCnt(){return 99;}

    removeChild(childIdx) {
        var childNode = this._childNodes[childIdx];
        this._childNodes.splice(childIdx, 1);
        childNode.parent = null;
    }
    insertChild(childIdx, childNode) {
        if(childNode.parent) throw 'Only free node can be inserted';
        if(this._childNodes.length==this.maximumChildrenCnt) throw 'Maximum children count excess';
        this._childNodes.splice(childIdx, 0, childNode);
        childNode.parent = this;
    }
}

class AccData{
    constructor(givenData=['', []], accountType){
        this._accountType = accountType;
        this._hierarchy = null;
        this._itemFields = null;
        this.applyAccountType();
        this._root = this.parseReadIn(givenData[0]);
        
    }

    get hierarchy() {return this._hierarchy;}
    get itemFields() {return this._itemFields;}
    get type() {return this._accountType;}
    get root() {return this._root;}//let public?

    parseReadIn(data) {
        var node = null;
        if(data.length==2) {//class node
            node = new AccClassNode(data[0]);
            for(var i=0; i<data[1].length; i++) {
                var childNode = this.parseReadIn(data[1][i]);
                node.insertChild(node.children.length, childNode);
            }
        }else{//item node
            node =  new AccItemNode();
            for(var i=0; i<data.length; i++) node[this._itemFields[i]] = data[i];
        }
        return node;
    }
    applyAccountType() {
        if(this._accountType[0] == 'planning' && this._accountType[1] == 'income'){
            this._hierarchy = null;
            this._itemFields = null;
        }else if(this._accountType[0] == 'planning' && this._accountType[1] == 'expenditure'){
            this._hierarchy = null;
            this._itemFields = null;
        }else if(this._accountType[0] == 'closing' && this._accountType[1] == 'income'){
            this._hierarchy = ['기구', '출처'];
            this._itemFields = ['항목', '코드', '예산', '결산', '집행률', '비고'];
        }else if(this._accountType[0] == 'closing' && this._accountType[1] == 'expenditure'){
            this._hierarchy = ['기구', '담당', '대항목'];
            this._itemFields = ['항목', '출처', '코드', '예산', '결산', '집행률', '비고'];
        }
    }

    _isSibling(path1, path2) {
        if (path1.length != path2.length) return false;
        var len = path1.length;
        if (path1.slice(0, len-1).value == path2.slice(0, len-1).value) return true;
        return false;
    }


    _getNode(path) {
        var node = this._root;
        for(var i=1; i<path.length; i++) node = node.children[path[i]];
        return node;
    }

    getClassName(classPath) {
        return this._getNode(classPath).name;
    }
    setClassName(classPath, newName) {
        this._getNode(classPath).name = newName;
    }

    getItemField(itemPath, feildKey) {
        return this._getNode(itemPath)[feildKey];
    }
    setItemField(itemPath, feildKey, feildData) {
        this._getNode(itemPath)[feildKey] = feildData;
    }

    _insert(path, node) {
        this._getNode(path.slice(0,path.length-1)).insertChild(path[path.length-1], node);
    }
    insertNew(path) {
        if(path.length <= this._hierarchy.length) this._insert(path, new AccClassNode());
        else this._insert(path, new AccItemNode());
    }

    remove(path, isLeavingEmptyClass = true) {
        this._getNode(path.slice(0,path.length-1)).removeChild(path[path.length-1]);
    }

    move(fromPath, toPath) {
        var fromPathCopy = fromPath.copy;
        var toPathCopy = toPath.copy;
        var movingNode = this._getNode(fromPathCopy);
        
        this.remove(fromPathCopy);
        this._insert(toPathCopy, movingNode);
    }

    traverseSubtree(node, visitFunc) {
        var mappedChildren = null;
        if(node.isClass()) mappedChildren = node.children.map((child)=>{return this.traverseSubtree(child, visitFunc);});
        return visitFunc(node, mappedChildren);
    }
    traverseTree(visitFunc) {
        this.traverseSubtree(this._root, visitFunc);
    }

    countItemsInClass(classPath) {
        if(classPath.length == this._hierarchy.length){//lowest class
            return this._getNode(classPath).children.length;
        } else {//sum item-count in subclasses
            var itemCount = 0;
            for(let i = 0; i < this._getNode(classPath).children.length; i++) {
                var subClassPath = classPath.concat([i]);
                itemCount += this.countItemsInClass(subClassPath);
            }
            return itemCount;
        }
    }
    countChildren(classPath) {
        return this._getNode(classPath).children.length;
    }

    //--Item Code--
    _calculateItemCode(itemPath){
        if(itemPath[1] > 25 || itemPath[2] > 25 || (itemPath.length==4 && itemPath[3] > 25)) alert('코드 배정 범위 초과');
        if(itemPath.length==3)
            return String.fromCharCode(65 + itemPath[1]) + String.fromCharCode(65 + itemPath[2]);
        if(itemPath.length==4)
            return String.fromCharCode(65 + itemPath[1]) + String.fromCharCode(65 + itemPath[2]) + (itemPath[3]+1);
    }
    reassignItemCodes(){
        var setItemCode = function(node) {
            if(node.isItem()) node['코드'] = this._calculateItemCode(node.path);
        }

        this.traverseTree(setItemCode.bind(this));
    }

    //--Sum--
    calcPartialSum(classPath, fieldName){
        var calcSum = function(visitingNode, childSums) {
            if(visitingNode.isItem()) {
                var savdeData = parseInt(visitingNode[fieldName]);
                if(savdeData) return savdeData;
                else return 0;
            }
            else return childSums.reduce((accumulator, currentValue) => {return accumulator + currentValue;}, 0);
        }

        return this.traverseSubtree(this._getNode(classPath), calcSum.bind(this));
    }
}


class DragHandler {
    constructor(table){
        this._table = table;

        //bound 'this' of event handers for add/remove event handler
        this._boundUpdateWhileDrag = this.updateWhileDrag.bind(this);
        this._boundUpdateAfterDrag = this.endDrag.bind(this);
        this._boundRemoveObjChunk = this.removeObjChunk.bind(this);

        this._clickedMoment = 0;
        this._isDbClick = false;
        this._objChunk = null;
        this._objPath = null;
        this._floatingChunk = null;

        this._mouseDownX = 0;
        this._mouseDownY = 0;
        this._mouseDistX = 0;
        this._mouseDistY = 0;
        this._objOffsetX = 0;
        this._objOffsetY = 0;

        this._hidingRowCount = 0;

        //keywords
        this.INVISABLE = 'invisable-cell';
        this.SHADOW = 'shadow';
    }

    setEvent() {
        var dragHandles = this._table.DOMElement.getElementsByClassName(this._table.DRAGHANDLE);
        for(let i = 0; i < dragHandles.length; i++) {
            dragHandles[i].addEventListener('mousedown', this.startDrag.bind(this));
        }
    }

    getFirstRowOfChunk(chunkPath) {
        var firstRowPath = chunkPath.copy;
        var firstRow = null;
        for(; firstRowPath.length <= this._table.data.hierarchy.length + 1; firstRowPath.push(0)) {
            firstRow = document.getElementById(this._table.HTMLRowPrefix + firstRowPath.string);
            if(firstRow) return firstRow;
        }
    }
    getChunk(chunkPath) {
        var chunk = [];
        var rowToPush = this.getFirstRowOfChunk(chunkPath);//initializing as first row of chunk
        chunk.push(rowToPush);
        if(chunkPath.length < this._table.data.hierarchy.length + 1) {//only if class chunk
            var length = this._table.countClassRows(chunkPath);
            for(var i = 1; i < length; i++) {
                rowToPush = rowToPush.nextElementSibling;
                chunk.push(rowToPush);
            }
        }
        return chunk;
    }
    createFloatingChunk() {
        this._floatingChunk = document.createElement('Table');
        this._floatingChunk.append(this._table.createColgroup());

        for(var i = 0; i <this._objChunk.length; i++) {
            var chunkRow = this._objChunk[i].cloneNode(true);

            if(this._table.data.type[1]==this._table.INCOME) {
                if(chunkRow.cells[0].classList.contains(this._table.HTMLPrefix + this._table.data.hierarchy[0]))
                    chunkRow.cells[0].remove();
                if(chunkRow.cells[0].classList.contains(this._table.HTMLPrefix + this._table.data.hierarchy[1]))
                    chunkRow.cells[0].remove();
                chunkRow.insertCell(0).classList.add(this.INVISABLE);
                chunkRow.insertCell(0).classList.add(this.INVISABLE);
            }

            if(this._table.data.type[1]==this._table.EXPENDITURE) {
                if(chunkRow.cells[0].classList.contains(this._table.HTMLPrefix + this._table.data.hierarchy[0]))
                    chunkRow.cells[0].remove();
                chunkRow.insertCell(0).classList.add(this.INVISABLE);
                if(this._objPath.length >= 3){
                    if(chunkRow.cells[2].classList.contains(this._table.HTMLPrefix + this._table.data.hierarchy[1])) {
                        chunkRow.cells[1].remove();
                        chunkRow.cells[1].remove();
                    }
                    chunkRow.insertCell(0).classList.add(this.INVISABLE);
                    chunkRow.insertCell(0).classList.add(this.INVISABLE);
                    if(this._objPath.length >= 4){
                        if(chunkRow.cells[4].classList.contains(this._table.HTMLPrefix + this._table.data.hierarchy[2])) {
                            chunkRow.cells[3].remove();
                            chunkRow.cells[3].remove();
                        }
                        chunkRow.insertCell(0).classList.add(this.INVISABLE);
                        chunkRow.insertCell(0).classList.add(this.INVISABLE);
                    }
                }
            }

            this._floatingChunk.append(chunkRow);
        }

        this._floatingChunk.id = 'drag-elem';
        this._floatingChunk.classList.add(this._table.HTMLTableClass);

        document.getElementById('ui-container').append(this._floatingChunk);

        this._floatingChunk.style.position = 'fixed';
        this._floatingChunk.style.top = this._objChunk[0].getBoundingClientRect().y + 'px';
        this._floatingChunk.style.left = this._objChunk[0].getBoundingClientRect().x + 'px';

        // this._floatingChunk.style.left = '50%';
        // this._floatingChunk.style.marginLeft = (-this._floatingChunk.offsetWidth/2) + 'px';

        // document.dispatchEvent(new MouseEvent('mousemove',
        //     { view: window, cancelable: true, bubbles: true }
        // ));

        return this._floatingChunk;
    }
    styleObjCunk() {
        for(var i=0; i<this._objChunk.length; i++) {
            var chunkRow = this._objChunk[i];
            var cellCnt = 0;
            var leavingCellCnt = 0;//number of cells we won't change
            var cellIdx = 0;
            while(cellIdx<chunkRow.cells.length) {
                var cell = chunkRow.cells[cellIdx];
                if(cell.hasAttribute('rowspan')) cellCnt += cell.getAttribute('rowspan');
                else cellCnt++;
                var isHigherLevelDragHandle =
                    cell.classList.contains(this._table.DRAGHANDLE)
                    && this._objPath.length>Path.parse(cell.getAttribute('path')).length;
                var isHigherLevelClassCell =
                    cell.classList.contains(this._table.HTMLClassClass)
                    && this._objPath.length>Path.parse(cell.getAttribute('path')).length;
                if(isHigherLevelDragHandle || isHigherLevelClassCell) {
                    leavingCellCnt ++;
                    cellIdx++;
                    continue;
                }
                cell.remove();
            }
            if(i==0) {
                var shadowCell = chunkRow.insertCell();
                shadowCell.classList.add(this.SHADOW);
                shadowCell.setAttribute('rowspan', this._objChunk.length);
                shadowCell.setAttribute('colspan', cellCnt-leavingCellCnt);
            }
        }
    }
    startDrag(event) {
        if(event.button != 0) return true;

        this._objPath = Path.parse(event.target.getAttribute('path'));
        this._objChunk = this.getChunk(this._objPath);

        var prevClickMoment = this._clickedMoment;
        this._clickedMoment = Date.now();

        if(this._clickedMoment - prevClickMoment < 300){
            var pathToInsert = this._objPath.copy;
            pathToInsert[pathToInsert.length-1]++;
            this._table.insertNew(pathToInsert);
            this.endDrag();
            this._clickedMoment = 0;
        }else{
            document.onselectstart = () => {return false;}//prevent error might be occured by drag selection
            //document.addEventListener('selectstart', returnFalse);

            if(this._objChunk) {
                this.createFloatingChunk();
                this.styleObjCunk();
                this._mouseDownX = event.clientX;
                this._mouseDownY = event.clientY;
                this._objOffsetX = 0;
                this._objOffsetY = 0;
                document.addEventListener('mousemove', this._boundUpdateWhileDrag);
                document.addEventListener('mouseup', this._boundUpdateAfterDrag);
            }
        }
    }

    //move function
    getChunkInfo(givenRow) {//get chunck information in scope of objChunk level
        var chunkPath = this._table.getRowPath(givenRow);
        var chunkType = null;

        if(chunkPath.length < this._objPath.length-1) {//chunkPath is more then one level higher
            return {'type': 'invalid','path': null};
        }else if(chunkPath.length == this._objPath.length-1) {//chunkPath is one level higher
            if(givenRow.classList.contains(this._table.EMPTYROW)) 
                chunkType = 'emptyClass';
            else if(givenRow.classList.contains(this._table.HTMLSumRowClass)) 
                chunkType = 'classSum';
        }else{
            chunkPath = chunkPath.slice(0, this._objPath.length);
            chunkType = 'normal';
        }

        return {'type': chunkType, 'path': chunkPath};
    }
    getChunkPos(chunkInfo) {//only y position and height is valid
        if(chunkInfo.type == 'emptyClass') {
            return document.getElementById(this._table.HTMLRowPrefix + chunkInfo.path.string).getBoundingClientRect();
        }else if(chunkInfo.type == 'classSum') {
            return document.getElementById(this._table.HTMLSumRowPrefix + chunkInfo.path.string).getBoundingClientRect();
        }else if(chunkInfo.type == 'normal') {
            if(chunkInfo.path.length == this._table.data.hierarchy.length + 1) {//item chunk
                return document.getElementById(this._table.HTMLItemPrefix + '항목-' + chunkInfo.path.string).getBoundingClientRect();
            }else{//class chunk
                var classCell = document.getElementById(this._table.HTMLIDPrefix + chunkInfo.path.string);
                return classCell.getBoundingClientRect();
            }
        }
    }
    debugLine(y,color) {
        var svgElem = document.getElementById('debugSvg');
        if(!svgElem) {
            svgElem = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgElem.id = 'debugSvg';
            document.body.prepend(svgElem);
            svgElem.style.position = 'absolute';
            svgElem.style.top = '0';
            svgElem.style.left = '0';
            svgElem.style.height = '1500px';
            svgElem.style.width = '1300px';
            // svgElem.setAttribute('height','1500px');
            // svgElem.setAttribute('width','1300px');
        }

        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1','100');
        line.setAttribute('y1',y);
        line.setAttribute('x2','1300');
        line.setAttribute('y2',y);
        line.style.stroke = color;

        svgElem.append(line);
    }
    debugLines(objPos, checkingPos, floatingPos, scrollY) {
        var exSvg = document.getElementById('debugSvg');
        if(exSvg) exSvg.remove();

        this.debugLine(scrollY+objPos.y,'red');
        this.debugLine(scrollY+objPos.y+objPos.height,'red');
        this.debugLine(scrollY+checkingPos.y, 'blue');
        this.debugLine(scrollY+checkingPos.y+checkingPos.height, 'blue');
        this.debugLine(scrollY+floatingPos.y, 'green');
        this.debugLine(scrollY+floatingPos.y+floatingPos.height, 'green');
    }
    isMoveCondition(checkingChunkInfo) {//if check criteria satisfied to move objChunk in to position of checkingChunk
        var objPos = this._objChunk[0].getBoundingClientRect(),
            floatingPos = this._floatingChunk.getBoundingClientRect(),
            checkingPos = this.getChunkPos(checkingChunkInfo);

        // this.debugLines(objPos, checkingPos, floatingPos, window.scrollY);

        var posCriteria = checkingPos.y + checkingPos.height / 2;
        if(objPos.y < checkingPos.y) {//getting closer from higer position
            if((floatingPos.y + floatingPos.height / 2) > posCriteria) return true;
        }else{//getting closer from lower position
            if(floatingPos.y + floatingPos.height / 2 < posCriteria) return true;
        }
        // Math.abs(floatingPos.y - rowPos.y) < rowPos.height / 2 //old criteria
        return false;
    }
    findPosToMoveIn() {
        let objRowPos = this._objChunk[0].rowIndex - this._table.tHeadLength,
            rows = this._table.DOMElement.querySelectorAll('tbody tr'),
            checkingDist = 2,//if checkingDist is 1 drag move might not work. in case of row hide must check again.
            checkingRange = {
                "start": Math.max(0, objRowPos-checkingDist),
                "end": Math.min(rows.length-1, objRowPos+this._objChunk.length+checkingDist)
            },
            slideDownChunkInfo = null;//chunk that shoul give its place ot objCunk

        for(let i = checkingRange.start; i<=checkingRange.end; i++) {
            var checkingChunkInfo = this.getChunkInfo(rows[i]);
            if(checkingChunkInfo.type == 'invalid') continue;
            if(checkingChunkInfo.path.value == this._objPath.value) continue;
            if(this.isMoveCondition(checkingChunkInfo)) {
                slideDownChunkInfo = checkingChunkInfo;

                var toPath = null;

                if(slideDownChunkInfo.type == 'emptyClass') {
                    toPath = slideDownChunkInfo.path.concat(0);
                }else if(slideDownChunkInfo.type == 'classSum') {
                    var parentPath = this._objPath.slice(0, this._objPath.length-1);
                    if(slideDownChunkInfo.path.value == parentPath) continue;
                    toPath =  slideDownChunkInfo.path.concat(this._table.data.countChildren(slideDownChunkInfo.path));
                }else if(slideDownChunkInfo.type == 'normal') {
                    toPath = slideDownChunkInfo.path;
                }else{
                    console.log(slideDownChunkInfo);
                }

                if(toPath.value == this._objPath.value) continue;  

                return toPath;
            }
        }

        return null;
    }
    moveRowAndUpdate(toPath) {
        var beforePosX = this._objChunk[0].getBoundingClientRect().x;
        var beforePosY = this._objChunk[0].getBoundingClientRect().y;

        this._table.data.move(this._objPath, toPath);
        this._table.rereadTable();
        this._objPath = toPath.copy;
        this._objChunk = this.getChunk(this._objPath);
        this.styleObjCunk();

        var afterPosX = this._objChunk[0].getBoundingClientRect().x;
        var afterPosY = this._objChunk[0].getBoundingClientRect().y;
        this._objOffsetX += afterPosX - beforePosX;
        this._objOffsetY += afterPosY - beforePosY;
    }
    updateMoveGraphic() {
        this._floatingChunk.style.opacity = 0.7;
        this._floatingChunk.style.transform = 'translate3d(' 
            + 0 + 'px, ' 
            + this._mouseDistY + 'px, 0)';
    }

    //remove function
    removeObjChunk(){
        this._table.data.remove(this._objPath);
        this._table.rereadTable();
        this.endDrag();
        document.removeEventListener('mouseup', this._boundRemoveObjChunk);
    }
    clacRemoveGraphic(x) {
        var l = 400;
        var t = 500;
        if(x>650) return 500;
        else return 500*Math.sin(x/500);
    }
    updateRemoveGraphic() {
        this._floatingChunk.style.transform = 'translate3d(' 
            + this.clacRemoveGraphic(this._mouseDistX) + 'px, ' 
            + this._objOffsetY + 'px, 0)';
        this._floatingChunk.style.opacity = Math.max(-0.7/230*this._mouseDistX + 580*0.7/230,0.35);
    }

    updateWhileDrag(event) {
        this._mouseDistX = event.clientX - this._mouseDownX;
        this._mouseDistY = event.clientY - this._mouseDownY;
        if(this._mouseDistX>60 && this._mouseDistX>1.5*this._mouseDistY) {
            this.updateRemoveGraphic();
            if(this._mouseDistX>650) document.addEventListener('mouseup', this._boundRemoveObjChunk);
            else document.removeEventListener('mouseup', this._boundRemoveObjChunk);
        }else{
            this.updateMoveGraphic();
            var posToMoveIn = this.findPosToMoveIn();
            if(posToMoveIn) this.moveRowAndUpdate(posToMoveIn);
        }
    }
    endDrag() {
        this._objChunk = null;
        // this._objPath = null;//syncroniztion problem with remove function
        this._floatingChunk.remove();
        document.onselectstart = null;
        document.removeEventListener('mousemove', this._boundUpdateWhileDrag);
        document.removeEventListener('mouseup', this._boundUpdateAfterDrag);
        this._table.rereadTable();
        //leave this._clickedMoment to trigger insertNew
    }
}

class AccTable{
    constructor(tableID, parentElement, givenData){
        this._tabelID = tableID;

        this._data = givenData;

        this._itemCellComposition = null;
        this._itemCellFieldMatch = null;
        this.applyTableType();
        // this._classComposition = this.data.hierarchy;

        this._columnShow = Array.from(
            {length: this.data.hierarchy.length + this._itemCellComposition.length}, 
            () => true); //[true, true, true, ..., true]

        this.HTMLColPrefix = this.HTMLPrefix + 'col-';
        this.HTMLHeadPrefix = this.HTMLPrefix + 'h-';

        this._tableElement = document.createElement('table');
        this._tableElement.id = this.HTMLIDPrefix + 'table';
        this._tableElement.classList.add(this.HTMLPrefix + 'table');

        this._tableColgroup = this.createColgroup();
        this._tableElement.append(this._tableColgroup);
        this._tableElement.append(this.createThead());

        parentElement.append(this._tableElement);

        this._dragHanlder = new DragHandler(this);
        this.readDataAndSet();
    }
    get DOMElement() {return this._tableElement;}
    get data() {return this._data;}

    //HTML keywords
    get HTMLPrefix() {return 'acc-';}
    get HTMLIDPrefix() {return this.HTMLPrefix + this._tabelID + '-'}
    get HTMLTableClass() {return this.HTMLPrefix + 'table';}
    get HTMLRowPrefix() {return this.HTMLIDPrefix + 'row-';}
    get HTMLSumRowClass() {return this.HTMLRowPrefix + 'sum';}
    get HTMLSumRowPrefix() {return this.HTMLRowPrefix + 'sum-';}
    get HTMLSumCellPrefix() {return this.HTMLRowPrefix + 'sum-';}
    get HTMLClassClass() {return this.HTMLPrefix + 'class';}
    get HTMLClassPrefix() {return this.HTMLIDPrefix + 'class-';}
    get HTMLItemClass() {return this.HTMLPrefix + 'item';}
    get HTMLItemPrefix() {return this.HTMLIDPrefix + 'item-';}

        // this.HTMLColPrefix = this.HTMLPrefix + 'col-';
        // this.HTMLHeadPrefix = this.HTMLPrefix + 'h-';

    //keywords
    get PLANNING() {return 'planning';}
    get CLOSING() {return 'closing';}
    get INCOME() {return 'income';}
    get EXPENDITURE() {return 'expenditure';}
    get DRAGHANDLE() {return 'drag-handle-cell';}
    get EMPTYROW() {return 'empty-placeholder-row';}
    get EMPTYCELL() {return 'empty-placeholder-cell';}
    SUM(level) {
        if(level=='high') return this.HTMLPrefix + 'sum-high';
        else if(level=='mid') return this.HTMLPrefix + 'sum-mid';
        else if(level=='low') return this.HTMLPrefix + 'sum-low';
    }

    //--Helper functions--
    get tableColgroup() {return this._tableColgroup;}
    get tHeadLength() {return this._tableElement.tHead.children.length;}
    getRowPath(elem) {
        var row  = elem.tagName == 'TR' ?  elem : elem.closest('tr');
        return Path.parse(row.getAttribute('path'));
    }
    snycCellToData(cell, feildData = cell.textContent) {//snyc from cell to data
        var itemPath = this.getRowPath(cell);
        var feildName = cell.getAttribute('feild-name');
        this._data.setItemField(itemPath, feildName, feildData);
    }
    snycClassName(event) {//classCell, className = classCell.textContent) {//snyc from table to data
        var classCell = event.target; 
        var className = classCell.textContent
        var classPath = Path.parse(classCell.getAttribute('path'));
        this._data.setClassName(classPath, className);
    }
    countClassRows(classPath) { //count including empty class row
        if(classPath.length == this._data._hierarchy.length){//lowest class
            return Math.max(1, this._data.countChildren(classPath))+1;//least 1 in empty case, add 1 for sumRow
        } else {//sum row count in subclasses
            var rowCount = 0;
            if(this._data.countChildren(classPath) == 0) rowCount = 1;
            else{
                for(let i = 0; i < this._data.countChildren(classPath); i++){
                    var subClassPath = classPath.concat([i]);
                    rowCount += this.countClassRows(subClassPath);
                }
            }
            return rowCount+1;//add 1 for sumRow
        }
    }
    selectOnFocus(focusEvent) { //focusedCell must be an element
        var focusedCell = focusEvent.target;
        if(!focusedCell.hasChildNodes()) return;
        var range = document.createRange();
        var selection = window.getSelection();
        range.setStartBefore(focusedCell.childNodes[0]);
        range.setEndAfter(focusedCell.childNodes[0]);
        selection.removeAllRanges();
        selection.addRange(range);

        focusedCell.scroll(9999,0);
    }
    preventEventDefault(event) {
        event.preventDefault();
    }

    getHTMLID(opt, path) {

    }

    //--Construstion function--
    applyTableType() {
        if(this._data.type[0] == 'planning' && this._data.type[1] == 'income'){
            this._itemCellComposition = null;
            this._itemCellFieldMatch = null;
        }else if(this._data.type[0] == 'planning' && this._data.type[1] == 'expenditure'){
            this._itemCellComposition = null;
            this._itemCellFieldMatch = null;
        }else if(this._data.type[0] == 'closing' && this._data.type[1] == 'income'){
            this._itemCellComposition = [this.DRAGHANDLE, '항목', '코드', '예산', '결산', '집행률', '비고'];
            this._itemCellFieldMatch = [null, 0, 1, 2, 3, 4, 5];
        }else if(this._data.type[0] == 'closing' && this._data.type[1] == 'expenditure'){
            this._itemCellComposition = ['출처', this.DRAGHANDLE, '항목', '코드', '예산', '결산', '집행률', '비고'];
            this._itemCellFieldMatch = [1, null, 0, 2, 3, 4, 5, 6];
        }
    }
    createColgroup() {
        var colgroup = document.createElement('colgroup');
        for(var i = 0; i < this.data.hierarchy.length; i++) {
            if(this._data.type[1]==this.EXPENDITURE && i > 0) {
                var col = document.createElement('col');
                col.classList.add(this.HTMLColPrefix + this.DRAGHANDLE);
                colgroup.append(col);
            }
            var col = document.createElement('col');
            col.classList.add(this.HTMLColPrefix + this.data.hierarchy[i]);
            colgroup.append(col);
        }
        for(var i = 0; i < this._itemCellComposition.length; i++) {
            var col = document.createElement('col');
            col.classList.add(this.HTMLColPrefix + this._itemCellComposition[i]);
            colgroup.append(col);
        }
        return colgroup;
    }
    createThead() {
        var thead = document.createElement('thead');

        var firstRow = document.createElement('tr');
        var firstRowTh = document.createElement('th');

        var title = '';
        if(this._data.type[1]==this.INCOME) title = '수입';
        else if(this._data.type[1]==this.EXPENDITURE) title = '지출';

        var addedColCount = 0;
        if(this._data.type[1]==this.EXPENDITURE) addedColCount = 2;

        firstRowTh.textContent = title;
        firstRowTh.setAttribute('colspan', this.data.hierarchy.length + this._itemCellComposition.length + addedColCount);
        firstRow.append(firstRowTh);

        var secondRow = document.createElement('tr');
        for(var i = 0; i < this.data.hierarchy.length; i++) {//class rows
            var td = document.createElement('td');
            td.textContent = this.data.hierarchy[i];
            td.classList.add(this.HTMLHeadPrefix + this.data.hierarchy[i]);
            secondRow.append(td);
            if(this._data.type[1]==this.EXPENDITURE && i > 0)
                td.setAttribute('colspan', '2');
        }
        for(var i = 0; i < this._itemCellComposition.length; i++){//item rows
            var td = null;
            if(this._itemCellComposition[i] != this.DRAGHANDLE) {
                td = document.createElement('td');
                td.textContent = this._itemCellComposition[i]
                td.classList.add(this.HTMLHeadPrefix + this._itemCellComposition[i]);
                secondRow.append(td);
            }
            if(i >= 1 && this._itemCellComposition[i-1] == this.DRAGHANDLE)
                td.setAttribute('colspan', '2');
        }

        thead.append(firstRow);
        thead.append(secondRow);
        return thead;
    }

    //--Percent--
    calculatePercent(row, isSumRow = false) {
        var denominatorCell = null;
        var numeratorCell = null;
        var percntCell = null;
        if(isSumRow) {
            denominatorCell = row.cells[row.cells.length-4];
            numeratorCell = row.cells[row.cells.length-3];
            percntCell = row.cells[row.cells.length-2];
        }else {
            if(row.getElementsByClassName(this.HTMLPrefix+this._data.itemFields[4]).length==0) return;//table load not done
            denominatorCell = row.getElementsByClassName(this.HTMLPrefix+'예산')[0];
            numeratorCell = row.getElementsByClassName(this.HTMLPrefix+'결산')[0];
            percntCell = row.getElementsByClassName(this.HTMLPrefix+'집행률')[0];
        }

        if(!percntCell) return;// percntCell doesn't exist

        if(denominatorCell.hasAttribute('number-data') && numeratorCell.hasAttribute('number-data')) {
            if(denominatorCell.getAttribute('number-data') == 0) percntCell.textContent = '신설';
            else {
                var denominator = Number(denominatorCell.getAttribute('number-data'));
                var numerator = Number(numeratorCell.getAttribute('number-data'));
                percntCell.textContent = parseFloat(numerator/denominator*100).toFixed(2)+'%';
            }
        } else {percntCell.textContent = '';}
    }

    //--Sum--
    updatePartialSum(classPath) {
        var sumRow = document.getElementById(this.HTMLSumRowPrefix + classPath.string);
        var feilds = [this._itemCellComposition[this._itemCellComposition.length-4]
            ,this._itemCellComposition[this._itemCellComposition.length-3]];

        for(var i=0; i<2; i++) {
            var field = feilds[i];
            var sumCell = sumRow.getElementsByClassName(this.HTMLSumCellPrefix + field)[0];
            var sum = null;

            if(classPath.length == this._data.hierarchy.length)//lowest level class
                sum = this._data.calcPartialSum(classPath, field);
            else{
                sum = 0;
                for(var j=0; j<this._data.countChildren(classPath); j++){
                    var childPath = classPath.concat(j);
                    var childClassSumRow = document.getElementById(this.HTMLSumRowPrefix + childPath.string);
                    var childClassSumCell = childClassSumRow.getElementsByClassName(this.HTMLSumCellPrefix + field)[0];
                    sum += parseInt(childClassSumCell.getAttribute('number-data'));
                }
            }

            if(sum == '0') {
                sumCell.textContent = '-';
                sumCell.style.textAlign = "center"
            }else{
                var formatter = new Intl.NumberFormat('ko-KR', {style: 'currency', currency: 'KRW',});
                sumCell.textContent = formatter.format(sum);
                sumCell.style.textAlign = "left"
            }
            sumCell.setAttribute('number-data', sum);
        }
        this.calculatePercent(sumRow, true);
    }
    bubbleUpdatePartialSum(classPath) {
        if(document.getElementById(this.HTMLSumRowPrefix + classPath.string).cells.length==0) return;//table load not done
        var classPathCopy = classPath.copy;
        while(0<classPathCopy.length) {
            this.updatePartialSum(classPathCopy.copy);
            classPathCopy.pop();
        }
    }

    //--After item source select--
    updateItemSrcSelect(cell){

        cell.classList.remove(this.HTMLPrefix + '출처-학생',
            this.HTMLPrefix + '출처-자치',
            this.HTMLPrefix + '출처-본회계');

        var select = cell.getElementsByTagName('select')[0];
        var selectedIdx = select.selectedIndex;
        var selected = null;
        switch(selectedIdx){
            case 1://학생
                selected = '학생';
                cell.classList.add(this.HTMLPrefix + '출처-' + selected);
                break;
            case 2://자치
                selected = '자치';
                cell.classList.add(this.HTMLPrefix + '출처-' + selected);
                break;
            case 3://본회계
                selected = '본회계';
                cell.classList.add(this.HTMLPrefix + '출처-' + selected);
                break;
        }
        this.snycCellToData(cell, selected);
    }

    //--Cell formatting functions--    
    handlePaste(pasteEvent, isNewlineAllowed = false) {
        var paste = pasteEvent.clipboardData.getData('text');//IE not supported
        var selection = window.getSelection();

        if(!isNewlineAllowed)
            paste = paste.replace(/[\f\n\r\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/gm, '');

        if (!selection.rangeCount) return false;
        selection.deleteFromDocument();
        selection.getRangeAt(0).insertNode(document.createTextNode(paste));
        // document.execCommand("insertHTML", false, text);

        pasteEvent.preventDefault();
    }
    preventEnter(keyEvent) {
        if(keyEvent.keyCode == 13) keyEvent.returnValue = false;
    }
    getSelectionLength() {
        var range = window.getSelection().getRangeAt(0);
        return range.endOffset - range.startOffset;
    }
    markSelectionPos(node) {
        var range = window.getSelection().getRangeAt(0);
        node.setAttribute('original-range-start-offset', range.startOffset);
        node.setAttribute('original-range-end-offset', node.textContent.length - range.endOffset);
    }
    restoreSelection(node, rangeStartDiff = 0, rangeEndDiff = rangeStartDiff) { //rangeEndDiff: difference of offset of rangeEnd from node end, right is positive direction
        if(!node.hasChildNodes()) return;
        var range = document.createRange();
        var selection = window.getSelection();
        var rangeStart0 = node.getAttribute('original-range-start-offset')*1;
        var rangeEnd0 = node.getAttribute('original-range-end-offset')*1;
        var newRangeStart = Math.max(0, rangeStart0 + rangeStartDiff)
        var newRangeEnd = Math.max(newRangeStart, Math.min(node.textContent.length, node.textContent.length - rangeEnd0 + rangeEndDiff));
        range.setStart(node.childNodes[0], newRangeStart);
        range.setEnd(node.childNodes[0], newRangeEnd);
        selection.removeAllRanges();
        selection.addRange(range);
        node.removeAttribute('original-range-start-offset');
        node.removeAttribute('original-range-end-offset');
    }
    removeExceptNum(cell) {
        if(!cell.hasChildNodes()) return false;
        cell.textContent = cell.textContent.replace(/[^0-9]/gm, '');
    }
    amountCellPrepareKeyboardEdit(focusEvent) {
        var amountCell = focusEvent.target;
        amountCell.textContent = amountCell.getAttribute('number-data');
        amountCell.style.textAlign = "left"
    }
    amountCellFormatAndUpdate(amountCell) {
        this.removeExceptNum(amountCell);

        if(amountCell.textContent == '' || parseInt(amountCell.textContent) == '0') {
            this.snycCellToData(amountCell, 0);
            amountCell.setAttribute('number-data', 0);
            amountCell.textContent = '-';
            amountCell.style.textAlign = "center"
        }else{// if(isFinite(amountCell.textContent))
            if(amountCell.textContent.length > 15) alert('정밀도 한계 초과');
            this.snycCellToData(amountCell);
            var formatter = new Intl.NumberFormat('ko-KR', {style: 'currency', currency: 'KRW',});
            amountCell.setAttribute('number-data', amountCell.textContent*1);
            amountCell.textContent = formatter.format(amountCell.textContent);
            amountCell.style.textAlign = "left"
        }
        this.calculatePercent(amountCell.parentElement);
        var itemPath = Path.parse(amountCell.parentElement.getAttribute('path'));
        this.bubbleUpdatePartialSum(itemPath.slice(0,itemPath.length-1));
    }
    amountCellAfterKeyboardEdit(event) {
        event = event;//IE not supported
        if((event.ctrlKey||event.metaKey) && event.keyCode==86) return;//prevent function at ctrl+v
        if(event.shiftKey && (event.keyCode==37||event.keyCode==39)) return;//prevent function at shift+arrow
        if(event.keyCode==9) return;//prevent function at tab
        var cell = event.target;
        var originalLength = cell.textContent.length;
        this.markSelectionPos(cell);
        this.removeExceptNum(cell);
        this.restoreSelection(cell, cell.textContent.length - originalLength, 0);
    }
    amountCellAfterPaste(event) {
        event = event;//IE not supported
        var cell = event.target;
        var originalLength = cell.textContent.length;
        var selectionLength = this.getSelectionLength();
        this.markSelectionPos(cell);
        this.handlePaste(event);
        this.removeExceptNum(cell);
        this.restoreSelection(cell, selectionLength + cell.textContent.length - originalLength, 0);
    }
    setAmountCellAutoFormatting(amountCell) {
        amountCell.addEventListener('focus', this.amountCellPrepareKeyboardEdit.bind(this));
        amountCell.addEventListener('blur', () => {this.amountCellFormatAndUpdate(amountCell);});
        amountCell.addEventListener('keypress', (e) => {if((e.keyCode < 48) || (e.keyCode > 57)) e.returnValue = false;}); // keydown, keyup, compositionupdate
        amountCell.addEventListener('keyup', this.amountCellAfterKeyboardEdit.bind(this));
        amountCell.addEventListener('paste', this.amountCellAfterPaste.bind(this));
    }

    //--Generateing Table--
    setItemCell(cell, itemPath, itemCellType){
        var itemCellIdx = this._itemCellComposition.indexOf(itemCellType);
        if(itemCellIdx==-1) return;

        var fieldData = this._data.getItemField(itemPath, itemCellType);
        cell.textContent = fieldData;
        cell.setAttribute('feild-name', itemCellType);
        switch(itemCellType){
        case '출처'://출처
            cell.textContent = '';
            cell.classList.add(this.HTMLPrefix + itemCellType,
                this.HTMLPrefix + itemCellType + '-' + fieldData);

            var select = document.createElement('select');
            select.setAttribute('name', itemCellType);

            var optNull = document.createElement('option');
            optNull.textContent = '';
            optNull.setAttribute('value', '');
            optNull.setAttribute('disabled', 'true');
            select.append(optNull);
            var opt0 = document.createElement('option');
            opt0.textContent = '학생';
            opt0.setAttribute('value', '학생');
            select.append(opt0);
            var opt1 = document.createElement('option');
            opt1.textContent = '자치';
            opt1.setAttribute('value', '자치');
            select.append(opt1);
            var opt2 = document.createElement('option');
            opt2.textContent = '본회계';
            opt2.setAttribute('value', '본회계');
            select.append(opt2);

            if(fieldData=='학생') opt0.setAttribute('selected', true);
            else if(fieldData=='자치') opt1.setAttribute('selected', true);
            else if(fieldData=='본회계') opt2.setAttribute('selected', true);
            else optNull.setAttribute('selected', true);

            cell.append(select);
            select.addEventListener('change', (e) => {
                this.updateItemSrcSelect(e.target.parentElement);
            });
            break;
        case '항목'://항목
            cell.id = this.HTMLItemPrefix + itemCellType + '-' + itemPath.string;
            cell.classList.add(this.HTMLPrefix + itemCellType);
            cell.setAttribute('contenteditable', true);
            cell.addEventListener('focus', this.selectOnFocus);
            cell.addEventListener('blur', (e) => {
                this.snycCellToData(e.target);
                e.target.scroll(0,0);
            });
            cell.addEventListener('keypress', this.preventEnter.bind(this));//prevent Enter
            cell.addEventListener('paste', this.handlePaste.bind(this));
            cell.addEventListener('drop', this.preventEventDefault);//drag-drop paste
            break;
        case '코드'://코드
            cell.classList.add(this.HTMLPrefix + itemCellType);
            break;
        case '예산'://예산
            cell.classList.add(this.HTMLPrefix + itemCellType);
            cell.setAttribute('contenteditable', true);
            this.amountCellFormatAndUpdate(cell);//initial formatting
            this.setAmountCellAutoFormatting(cell);//includes updating datum
            cell.addEventListener('focus', this.selectOnFocus);
            cell.addEventListener('blur', (e) => {e.target.scroll(0,0);});
            cell.addEventListener('drop', this.preventEventDefault);//drag-drop paste
            break;
        case '결산'://결산
            cell.classList.add(this.HTMLPrefix + itemCellType);
            cell.setAttribute('contenteditable', true);
            this.amountCellFormatAndUpdate(cell);//initial formatting
            this.setAmountCellAutoFormatting(cell);//includes updating datum
            cell.addEventListener('focus', this.selectOnFocus);
            cell.addEventListener('blur', (e) => {e.target.scroll(0,0);});
            cell.addEventListener('drop', this.preventEventDefault);//drag-drop paste
            break;
        case '집행률'://집행률
            cell.classList.add(this.HTMLPrefix + itemCellType);
            this.calculatePercent(cell.parentElement);//initial formatting
            break;
        case '비고'://비고
            cell.classList.add(this.HTMLPrefix + itemCellType);
            cell.setAttribute('contenteditable', true);
            cell.addEventListener('blur', (e) => {this.snycCellToData(e.target)});
            cell.addEventListener('blur', (e) => {e.target.scroll(0,0);});
            cell.addEventListener('paste', (e) => {this.handlePaste(e, true);});//this undound
            cell.addEventListener('drop', this.preventEventDefault);//drag-drop paste
            break;
        }
        return cell;
    }
    setFunctionCell(cell, cellType, dataPath){
        switch(cellType){
        case this.DRAGHANDLE://드레그
            cell.classList.add(this.DRAGHANDLE);
            cell.setAttribute('path', JSON.stringify(dataPath));
            cell.textContent = '⋮';
            break;
        }
        return cell;
    }
    setClassCell(cell, classPath){
        cell.id = this.HTMLIDPrefix + classPath.string;
        cell.textContent = this._data.getClassName(classPath);
        cell.setAttribute('rowspan', Math.max(2, this.countClassRows(classPath)));
        cell.setAttribute('path', JSON.stringify(classPath));
        cell.classList.add(this.HTMLClassClass, 
                           this.HTMLPrefix + this.data.hierarchy[classPath.length-1]);
        if(this._data.type[1].localeCompare(this.EXPENDITURE) == 0 && 1<classPath.length) {
            cell.setAttribute('contenteditable', true);
            cell.addEventListener('blur', this.snycClassName.bind(this)); 
        }
        return cell;
    }
    createItemCells(rowPosition, itemPath) {
        var row = this._tableElement.rows[rowPosition];
        for(let i = 0; i < this._itemCellComposition.length; i++) {
            if (this._itemCellComposition[i].localeCompare(this.DRAGHANDLE) == 0)
                this.setFunctionCell(row.insertCell(), this.DRAGHANDLE, itemPath);
            else
                this.setItemCell(row.insertCell(), itemPath, this._itemCellComposition[i]);
        }
    }
    cntColInClass(classPath){
        var colPerHierarchyLevel = 1;
        if(this._data.type[1].localeCompare(this.EXPENDITURE) == 0) colPerHierarchyLevel = 2;
        return (this._data.hierarchy.length - classPath.length) * colPerHierarchyLevel + this._itemCellComposition.length;
    }
    createEmptyClassPlaceholderCell(row, classPath) {
        var cell = row.insertCell();
        cell.setAttribute('colspan', this.cntColInClass(classPath));
        cell.classList.add(this.EMPTYCELL);
        cell.textContent = 'empty';
        cell.addEventListener('dblclick', (()=>{this.insertNew(classPath.concat(0));}).bind(this));
    }
    createSumCells(rowPosition, classPath) {
        var row = this._tableElement.rows[rowPosition];
        var sumTitleCell = row.insertCell();
        var addedColCountInRest = 1;
        if(this._data.type[1]==this.EXPENDITURE) addedColCountInRest = 4-classPath.length;
        sumTitleCell.setAttribute('colspan', this.cntColInClass(classPath)-4);

        if(this._data.type[1]==this.INCOME) {
            if(classPath.length == 1) {
                sumTitleCell.textContent = "총계";
                sumTitleCell.classList.add(this.SUM('high'));
            }else{
                sumTitleCell.textContent = "계";
                sumTitleCell.classList.add(this.SUM('low'));
            }
        }else if(this._data.type[1]==this.EXPENDITURE) {
            if(classPath.length == 1) {
                sumTitleCell.textContent = "총계";
                sumTitleCell.classList.add(this.SUM('high'));
            }else if(classPath.length == 2) {
                sumTitleCell.textContent = "합계";
                sumTitleCell.classList.add(this.SUM('mid'));
            }else{
                sumTitleCell.textContent = "계";
                sumTitleCell.classList.add(this.SUM('low'));
            }
        }

        var cell0 = row.insertCell();
        cell0.classList.add(this.HTMLSumCellPrefix + this._itemCellComposition[this._itemCellComposition.length-4]);
        var cell1 = row.insertCell();
        cell1.classList.add(this.HTMLSumCellPrefix + this._itemCellComposition[this._itemCellComposition.length-3]);
        var cell2 = row.insertCell();
        var cell3 = row.insertCell();
        this.updatePartialSum(classPath);
    }
    createClassCell(row, classPath) {
        if(classPath.length > 1 && this._data.type[1]==this.EXPENDITURE) {
            var dragCell = this.setFunctionCell(row.insertCell(), this.DRAGHANDLE, classPath).setAttribute('rowspan', Math.max(2, (this.countClassRows(classPath))));
        }
        var cell = this.setClassCell(row.insertCell(), classPath);
        if(classPath.length > 1 && this._data.type[1]==this.EXPENDITURE) cell.classList.add('no-left-border');
    }
    createCellsRecursion(rowPosition, classPath){
        var row = this._tableElement.rows[rowPosition];
        this.createClassCell(row, classPath);

        var childPosition = rowPosition;
        var childrenCount = this._data.countChildren(classPath);
        var areChildrenClass = classPath.length < this._data.hierarchy.length;

        if(childrenCount == 0) {
            this.createEmptyClassPlaceholderCell(row, classPath);
        } else {
            for(let i = 0; i < childrenCount; i++) {
                var childDataPath = classPath.concat([i]);
                if(areChildrenClass) {//children are also class
                    this.createCellsRecursion(childPosition, childDataPath);
                    childPosition += (this.countClassRows(childDataPath));
                }else{//children are item
                    this.createItemCells(childPosition, childDataPath);
                    childPosition++;
                }
            }
        }

        this.createSumCells(rowPosition+this.countClassRows(classPath)-1, classPath);
    }
    createSumRow(classPath){
        var accTbody = this._tableElement.tBodies[0];
        var sumRow = accTbody.insertRow();
        sumRow.id = this.HTMLSumRowPrefix + classPath.string;
        sumRow.classList.add(this.HTMLSumRowClass);
        sumRow.setAttribute('path', JSON.stringify(classPath));
    }
    createRowsRecursion(classPath) {
        var accTbody = this._tableElement.tBodies[0];
        if(this._data.countChildren(classPath) == 0){//class doesn't have subclass, empty
                var row = accTbody.insertRow();
                row.id = this.HTMLRowPrefix + classPath.string;
                row.classList.add(this.EMPTYROW);
                row.setAttribute('path', JSON.stringify(classPath));
        }else if(classPath.length < this._data._hierarchy.length){//not lowest level class//recurse subclass
            for(let i = 0; i < this._data.countChildren(classPath); i++)
                this.createRowsRecursion(classPath.concat([i]));
        }else{//lowest level class
            for(var i = 0; i < this._data.countChildren(classPath); i++) {
                var itemPath = classPath.concat([i]);
                var row = accTbody.insertRow();
                row.id = this.HTMLRowPrefix + itemPath.string;
                row.classList.add(this.HTMLItemClass);
                row.setAttribute('path', JSON.stringify(itemPath));
            }
        }
        this.createSumRow(classPath);
    }
    readDataAndSet() {
        var accTbody = document.createElement('tbody');
        this._tableElement.append(accTbody);
        this.createRowsRecursion(new Path(0));
        this._data.reassignItemCodes();
        var startingRowPosition = 2;//row that item starts
        this.createCellsRecursion(startingRowPosition, new Path(0));
        this._dragHanlder.setEvent();
    }
    rereadTable() { //Read and draw table again.
        this._tableElement.tBodies[0].remove();
        this.readDataAndSet();
    }

    //--Insert--
    insertNew(objPath) {
        this._data.insertNew(objPath);
        this.rereadTable();
    }

    //--Show/hide row--
    countColumShow() {
        var count = 0;
        for(var i = 0; i < this._columnShow.length; ++i)
            if(this._columnShow[i]) count++;
        return count;
    }
    showHideCol(colType, isShow) {
        var cellsToHide = this._tableElement.getElementsByClassName(this.HTMLPrefix + colType);
        var headCellToHide = this._tableElement.getElementsByClassName(this.HTMLHeadPrefix + colType);
        var colToHide = this._tableElement.getElementsByClassName(this.HTMLColPrefix + colType);
        var columnIdx = this.data.hierarchy.length + this._itemCellComposition.indexOf(colType);
        var settingValue = '';
        if(!isShow) settingValue = 'none';

        for(var i = 0; i < cellsToHide.length; ++i) cellsToHide[i].style.display = settingValue;
        headCellToHide[0].style.display = settingValue;
        colToHide[0].style.display = settingValue;
        this._columnShow[columnIdx] = isShow;
        this._tableElement.tHead.rows[0].cells[0].setAttribute('colspan', this.countColumShow());
    }
    toggleShowHideCol(colType){
        var columnIdx = this.data.hierarchy.length + this._itemCellComposition.indexOf(colType);
        this.showHideCol(colType, !this._columnShow[columnIdx]);
    }
}

var incomeDataSource1 = 
        [
            ['r1c2', 
                [
                    ['학생', [
                        ['이월금', 'AA', 4742007, 4742007, '', ''],
                        ['학생회비 지원금', 'AB', 3046816, 0, '', '']
                    ]]
                    , 
                    ['본회계', [
                        ['중앙집행위원회 LT 지원금', 'BA', '1570000', '516300', '', ''],
                        ['중앙운영위원회 LT 지원금', 'BB', '1330000', '0', '', '']
                    ]], 
                    ['자치', [
                        ['이월금', 'CA', '26283551', '26283551', '', ''],
                        ['가상화폐 투자 수익금', 'CB', '0', '1002052847973', '', '']
                    ]]
                ]
            ]
        ];
var incomeData1 = new AccData(incomeDataSource1, ['closing','income']);
var incomeTable1 = new AccTable('income-table1', document.getElementById('ui-container'), incomeData1);

var expenditureDataSource1 = 
        [
            ['r1c2',[
                    ['사무국', [
                            ['사무 비용', [
                                ['사무 비품', '학생', '', '120000', '80000', '', ''],
                                ['응접 다과', '학생', '', '50000', '50000', '', ''],
                                ['사무실 오락기 설치', '학생', '', '1005000', '1004321', '', '']
                            ]],
                            ['회의 보조', [
                                ['회의 보조 수당', '학생', '', '80000', '80000', '', ''],
                                ['축하 공연 섭외', '학생', '', '16000000', '4500', '', '']
                            ]]
                    ]],
                    ['정책국', [
                            ['과학생회장 인기투표', [
                                
                            ]]
                    ]],
                    ['복지국', [
                            ['학생 복지관 겁립', [
                                ['공사 착수금', '학생', '', '250000000', '250000000', '', ''],
                                ['착공식', '학생', '', '280000000', '270800000', '', '']
                            ]],
                            ['전체 학우 만찬', [
                                ['출장 뷔페', '학생', '', '1200', '1400', '', '']
                            ]]
                    ]]
            ]]
        ];
var expenditureData1 = new AccData(expenditureDataSource1, ['closing','expenditure']);
var expenditureTable1 = new AccTable('expenditure-table1', document.getElementById('ui-container'), expenditureData1);


document.getElementById('button').addEventListener('click', () => {
    incomeTable1.snycClassName([0,0],'aaa');
    incomeTable1.rereadTable();
});

document.getElementById('reload-button').addEventListener('click', () => {
    incomeTable1.rereadTable();
    expenditureTable1.rereadTable();
});

document.getElementById('hide-button').addEventListener('click', () => {
    incomeTable1.toggleShowHideCol(document.getElementById('hide-target').value);
});



// $('table').hover(function(e){
//     if(  e.offsetX <= parseInt($(this).css('borderLeftWidth'))){
//         alert('hover on the left border!');
//     }
// });




