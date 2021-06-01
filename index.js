'use strict';
//window.onload = function() {}

function copyArray(arr){
    return arr.slice();
    // var newArr = [];
    // for(var i = 0; i < arr.length; i++) newArr.push(arr[i]);
    // return newArr;
}

function comparePath(arr1, arr2){
    if(arr1.length != arr2.length) return null;
    var eq = true;
    for(var i = 0; i < arr1.length; i++) {
        if(arr1[i] < arr2[i]) return 1;
        else if(arr1[i] > arr2[i]) return -1;
    }
    return 0;
}



class accData {
    constructor(source, givenHierarchy, givenItemFields){
        this._hierarchy = givenHierarchy;
        this._itemFields = givenItemFields;
        this._content = source;
    }
    get content() {
        return this._content;
    }
    get hierarchy() {
        return this._hierarchy;
    }
    get itemFields() {
        return this._itemFields;
    }
    fieldNum(fieldName) {//코드 관리를 위해 fieldNum은 변수가 아닌 string을 바로 인자로 호출
        return this._itemFields.indexOf(fieldName);
    }
    getClassData(classPath) {
        if(classPath.length == 1){
        return this.content[classPath[0]][1];
        }else if(classPath.length == 2){
        return this.content[classPath[0]][1][classPath[1]][1];
        }else if(classPath.length == 3){
        return this.content[classPath[0]][1][classPath[1]][1][classPath[2]][1];
        }
    }
    getItem(itemPath) {
        if(itemPath.length == 3)
            return this.content[itemPath[0]][1][itemPath[1]][1][itemPath[2]];
        else if(itemPath.length == 4)
            return this.content[itemPath[0]][1][itemPath[1]][1][itemPath[2]][1][itemPath[3]];
        else console.log('error');
    }
    getItemField(itemPath, feildIdx) {
        // console.log(itemPath);
        // console.log(typeof this.content[itemPath[0]][1][itemPath[1]][1][itemPath[2]][feildIdx]);
        if(itemPath.length == 3)
            return this.content[itemPath[0]][1][itemPath[1]][1][itemPath[2]][feildIdx];
        else if(itemPath.length == 4)
            return this.content[itemPath[0]][1][itemPath[1]][1][itemPath[2]][1][itemPath[3]][feildIdx];
        else console.log('error');
    }
    setItemField(itemPath, feildIdx, feildData) {
        if(itemPath.length == 3)
            this.content[itemPath[0]][1][itemPath[1]][1][itemPath[2]][feildIdx] = feildData;
        else if(itemPath.length == 4)
            this.content[itemPath[0]][1][itemPath[1]][1][itemPath[2]][1][itemPath[3]][feildIdx] = feildData;
        else console.log('error');
    }
    insertItem(itemPath, item) {
        if(itemPath.length == 3)
            this.content[itemPath[0]][1][itemPath[1]][1].splice(itemPath[2], 0, item);
        else if(itemPath.length == 4)
            this.content[itemPath[0]][1][itemPath[1]][1][itemPath[2]][1].splice(itemPath[3], 0, item);
        else console.log('error');
    }
    insertNewItem(itemPath) {
        var newItem = Array.from(this._itemFields.length, () => null);
        this.insertItem(itemPath, newItem);
    }
    removeItem(itemPath, isLeaveClass = false) {
        if(itemPath.length == 3){
            if(!isLeaveClass && this.countItemsInClass(itemPath.slice(0, 2)) == 1) 
                this.content[itemPath[0]][1].splice(itemPath[1], 1);
            else 
                this.content[itemPath[0]][1][itemPath[1]][1].splice(itemPath[2], 1);
        }else if(itemPath.length == 4){
            if(!isLeaveClass && this.countItemsInClass(itemPath.slice(0, 3)) == 1) {
                if(this.countItemsInClass(itemPath.slice(0, 2)) == 1)
                    this.content[itemPath[0]][1].splice(itemPath[1], 1);
                else
                    this.content[itemPath[0]][1][itemPath[1]][1].splice(itemPath[2], 1);
            }else 
                this.content[itemPath[0]][1][itemPath[1]][1][itemPath[2]][1].splice(itemPath[3], 1);
        }else{console.log('error');}
    }
    insertClass(classPath, insertingData) {
        if(classPath.length == 2){
        this.content[classPath[0]][1].splice(classPath[1], 0, insertingData);
        }else if(classPath.length == 3){
        this.content[classPath[0]][1][classPath[1]][1].splice(classPath[2], 0, insertingData);
        }else if(classPath.length == 4){
        this.content[classPath[0]][1][classPath[1]][1][classPath[2]][1].splice(classPath[3], 0, insertingData);
        }
    }
    insertNewClass(classPath) {
        var newClass = ['', []]
        this.insertClass(classPath, newClass);
    }
    removeClass(classPath, isLeaveParent = false) {
        if(classPath.length == 2){
            if(!isLeaveParent && this.content[classPath[0]][1].length == 1) 
                return false;//removeClass(classPath.slice(0,1));//can't remove root
            else {
                this.content[classPath[0]][1].splice(classPath[1], 1);
            }
        }else if(classPath.length == 3){
            if(!isLeaveParent && this.content[classPath[0]][1][classPath[1]][1].length == 1) {
                this.removeClass(classPath.slice(0,2));
            }
            else {
                this.content[classPath[0]][1][classPath[1]][1].splice(classPath[2], 1);
            }
        }else if(classPath.length == 4){
            if(!isLeaveParent && this.content[classPath[0]][1][classPath[1]][1][classPath[2]][1].length == 1) 
                this.removeClass(classPath.slice(0,3));
            else 
                this.content[classPath[0]][1][classPath[1]][1][classPath[2]][1].splice(classPath[3], 1);
        }
    }
    moveItem(from, to) {
        from = from*1;
        to = to*1;//in case of string
        var fromPath = this.getDataPath(from);
        var toPath = this.getDataPath(to);
        var pathLength = toPath.length;
        if (from < to) toPath[pathLength-1]++;
        
        var item = this.getItem(fromPath);
        this.insertItem(toPath, item);
        if(to < from && fromPath[pathLength-2] == toPath[pathLength-2]) fromPath[pathLength-1]++;
        this.removeItem(fromPath, true);
    }
    isSibling(originalPath1, originalPath2) {
        var path1 = copyArray(originalPath1);
        var path2 = copyArray(originalPath2);
        if (path1.length != path2.length) return false;
        var len = path1.length;
        if (comparePath(path1.slice(0, len-1), path2.slice(0, len-1))==0) return true;
        return false;
    }
    moveSubdata(fromPath, toPath) {
        // console.log(fromPath, toPath);
        if (fromPath.length != toPath.length) return;

        var fromPathCopy = copyArray(fromPath);
        var toPathCopy = copyArray(toPath);
        var pathLength = toPathCopy.length;
        if (this.isSibling(fromPathCopy, toPathCopy) && fromPathCopy[pathLength-1] < toPathCopy[pathLength-1])
            toPathCopy[pathLength-1]++;
        
        var insertingData = null;
        if(pathLength == this.hierarchy.length+1)//item data
            insertingData = this.getItem(fromPathCopy);
        else
            insertingData = [this.getClassName(fromPathCopy), this.getClassData(fromPathCopy)];
        this.insertClass(toPathCopy, insertingData);
        if(fromPathCopy[pathLength-2] == toPathCopy[pathLength-2] && fromPathCopy[pathLength-1] > toPathCopy[pathLength-1]) fromPathCopy[pathLength-1]++;
        this.removeClass(fromPathCopy, true);
    }
    getClassName(classPath) {
        if (classPath.length == 1) {
        return this.content[classPath[0]][0];
        } else if(classPath.length == 2) {
        return this.content[classPath[0]][1][classPath[1]][0];
        } else if(classPath.length == 3) {
        return this.content[classPath[0]][1][classPath[1]][1][classPath[2]][0];
        }
    }
    countItemsInClass(classPath) {
        if(classPath.length == this._hierarchy.length){//lowest class
            return this.countSubclasses(classPath);
        } else {//sum item-count in subclasses
            var itemCount = 0;
            for(let i = 0; i < this.countSubclasses(classPath); i++){
                // var subClassPath = classPath.slice();
                // subClassPath.push(i);
                var subClassPath = classPath.concat([i]);
                itemCount += this.countItemsInClass(subClassPath);
            }
            return itemCount;
        }
    }
    countSubclasses(classPath) {
        return this.getClassData(classPath).length;
    }
    getDataPathRecursion(idxInClass, dataPath) {
        if(dataPath.length == this._hierarchy.length) {
            dataPath.push(idxInClass);
            return dataPath;
        }else{
            var idx = idxInClass;
            // var childDataPath = dataPath.slice();
            // childDataPath.push(0);
            var childDataPath = dataPath.concat([0]);
            for(; idx >= this.countItemsInClass(childDataPath); childDataPath[childDataPath.length-1]++) {
                idx -= this.countItemsInClass(childDataPath);
            }
            return this.getDataPathRecursion(idx, childDataPath);
        }
    }
    getDataPath(idx) {
        return this.getDataPathRecursion(idx, [0]);
    }
    // getDataIdx(dataPath) {
    //     var idx = 0;
    //     for(var i = 0; i < dataPath[0]; i++)
    //         idx += this.countItemsInClass(dataPath.slice(0,1));
    //     if(dataPath.length >= 2)
    //         for(var i = 0; i < dataPath[1]; i++)
    //             idx += this.countItemsInClass(dataPath.slice(0,2));
    //     if(dataPath.length == 3)
    //         idx += dataPath[2];
    //     return ++idx;
    // }

    //--Item Code--
    calculateItemCode(itemPath){
        if(itemPath[1] > 25 || itemPath[2] > 25 || (itemPath.length==4 && itemPath[3] > 25)) alert('코드 배정 범위 초과');
        if(itemPath.length==3)
            return String.fromCharCode(65 + itemPath[1]) + String.fromCharCode(65 + itemPath[2]);
        if(itemPath.length==4)
            return String.fromCharCode(65 + itemPath[1]) + String.fromCharCode(65 + itemPath[2]) + (itemPath[3]+1);
    }
    reassignItemCodes(){
        for(var i = 0; i < this.countItemsInClass([0]); i++) {
            var itemPath = this.getDataPath(i);
            var itemCode = this.calculateItemCode(itemPath);
            this.setItemField(itemPath, this.fieldNum('코드'), itemCode);
        }
    }

    //--Sum--
    calcPartialSum(classPath, fieldName){
        var classData = this.getClassData(classPath);
        var sum = 0;

        if(classPath.length==this._hierarchy.length) {//lowest level class, sum data of items
            if(classData.length==0) return 0;
            for(var i=0; i<classData.length; i++) 
                sum += parseInt(this.getItemField(classPath.concat(i), this.fieldNum(fieldName)));//using parseInt becase the func returns string for unknown reason
        }else{//sum subclasses
            for(var i=0; i<classData.length; i++) 
                sum += this.calcPartialSum(classPath.concat(i), fieldName);
        }
        return sum;
    }
}

class dragHandler {
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
            dragHandles[i].addEventListener('dbclick', this.insertNew.bind(this));
            dragHandles[i].addEventListener('mousedown', this.startDrag.bind(this));
        }
    }

    getFirstRowOfChunk(chunkPath) {
        var firstRowPath = copyArray(chunkPath);
        var firstRow = null;
        for(; firstRowPath.length <= this._table.data.hierarchy.length + 1; firstRowPath.push(0)) {
            firstRow = document.getElementById(this._table.HTMLRowPrefix + firstRowPath);
            if(firstRow) return firstRow;
        }
    }
    getChunk(chunkPath) {
        var chunk = [];
        var rowToPush = this.getFirstRowOfChunk(chunkPath);//initializing as first row of chunk
        chunk.push(rowToPush);
        if(chunkPath.length < this._table.data.hierarchy.length + 1) {//class chunk
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

            if(this._table.mode[1]==this._table.INCOME) {
                if(chunkRow.cells[0].classList.contains(this._table.HTMLPrefix + this._table.data.hierarchy[0]))
                    chunkRow.cells[0].remove();
                if(chunkRow.cells[0].classList.contains(this._table.HTMLPrefix + this._table.data.hierarchy[1]))
                    chunkRow.cells[0].remove();
                chunkRow.insertCell(0).classList.add(this.INVISABLE);
                chunkRow.insertCell(0).classList.add(this.INVISABLE);
            }

            if(this._table.mode[1]==this._table.EXPENDITURE) {
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

        document.getElementById('ui-container').appendChild(this._floatingChunk);

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
                    && this._objPath.length>JSON.parse(cell.getAttribute('path')).length;
                var isHigherLevelClassCell =
                    cell.classList.contains(this._table.HTMLClassClass)
                    && this._objPath.length>JSON.parse(cell.getAttribute('path')).length;
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

        var prevClickMoment = this._clickedMoment;
        this._clickedMoment = Date.now();

        if(this._clickedMoment - prevClickMoment < 300){
            this.insertNew();
        }else{
            document.onselectstart = () => {return false;}//prevent error might be occured by drag selection
            //document.addEventListener('selectstart', returnFalse);
            this._objPath = JSON.parse(event.target.getAttribute('path'));
            this._objChunk = this.getChunk(this._objPath);

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
    normalizePath(originalPath) {
        var path = copyArray(originalPath);
        var normalPathLen = this._objPath.length;
        if (normalPathLen < path.length) path = path.slice(0, normalPathLen);
        else if (normalPathLen - path.length == 1) path.push('empty');
        return path;
    }
    getChunkPos(originalChunkPath) {//only y position and height is valid
        var chunkPath = copyArray(originalChunkPath);
        var pathLength = chunkPath.length;

        if(chunkPath[chunkPath.length-1]=='empty')//if row of empty class
            chunkPath.pop();//get position of higher level class

        if(pathLength == this._table.data.hierarchy.length + 1) {//item chunk
            return document.getElementById(this._table.HTMLRowPrefix + chunkPath).getBoundingClientRect();
        }else{//class chunk
            var classCell = this._table.DOMElement.getElementsByClassName(this._table.HTMLPrefix + chunkPath)[0];
            return classCell.getBoundingClientRect();
        }
    }
    isMoveCondition(checkingPath) {
        var objPos = this._objChunk[0].getBoundingClientRect(),
            floatingPos = this._floatingChunk.getBoundingClientRect(),
            checkingPos = this.getChunkPos(checkingPath);

        var posCriteria = checkingPos.y + checkingPos.height / 2;
        if(objPos.y < checkingPos.y) { //getting closer from higer position
            if(floatingPos.y + floatingPos.height / 2 > posCriteria) return true;
        }else{ //getting closer from lower position
            if(floatingPos.y + floatingPos.height / 2 < posCriteria) return true;
        }
        // Math.abs(floatingPos.y - rowPos.y) < rowPos.height / 2 //old criteria
        return false;
    }
    findPosToMoveIn() {
        let objRowPos = this._objChunk[0].rowIndex - this._table.tHeadLength,
            rows = this._table.DOMElement.querySelectorAll('tbody tr'),
            checkingRange = {
                "start": Math.max(0, objRowPos-1),
                "end": Math.min(rows.length-1, objRowPos+this._objChunk.length+1)
            };

        for(let i = checkingRange.start; i<=checkingRange.end; i++) {
            var checkingPath = this.normalizePath(this._table.getRowPath(rows[i]));
            if (this._objPath.length != checkingPath.length) continue;

            if(comparePath(this._objPath, checkingPath)!=0 && this.isMoveCondition(checkingPath))
                return checkingPath;
        }
        return null;
    }
    moveRowAndUpdate(normalizedToPath) {
        var beforePosX = this._objChunk[0].getBoundingClientRect().x;
        var beforePosY = this._objChunk[0].getBoundingClientRect().y;

        var toPath = normalizedToPath.map((x) => {return (x=='empty')?0:x;});
        this._table.data.moveSubdata(this._objPath, toPath);
        this._table.rereadTable();
        this._objPath = copyArray(toPath);
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
        this._table.data.removeClass(this._objPath, true);
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
    }

    //insert function
    insertNew() {
        var objPath = JSON.parse(event.target.getAttribute('path'));
        objPath[objPath.length-1] ++;
        if(objPath.length == this._table.data.hierarchy.length+1) this._table.data.insertNewItem(objPath);
        else this._table.data.insertNewClass(objPath);
        this._table.rereadTable();
        this._clickedMoment = 0;
    }
}

class accTable{
    constructor(tableID, parentElement, tableType, givenData){
        this._tabelID = tableID;
        this._tableType = tableType;

        this.HTMLColPrefix = this.HTMLPrefix + 'col-';
        this.HTMLHeadPrefix = this.HTMLPrefix + 'h-';

        this._dataHierarchy = null;
        this._dataItemFields = null;
        this._itemCellComposition = null;
        this._itemCellFieldMatch = null;
        this.applyTableType();
        // this._classComposition = this.data.hierarchy;

        this._data = new accData(givenData, this._dataHierarchy, this._dataItemFields);
        this._dataHierarchy = null;
        this._dataItemFields = null;

        this._columnShow = Array.from(
            {length: this.data.hierarchy.length + this._itemCellComposition.length}, 
            () => true); //[true, true, true, ..., true]

        this._tableElement = document.createElement('table');
        this._tableElement.id = this.HTMLIDPrefix + 'table';
        this._tableElement.classList.add(this.HTMLPrefix + 'table');

        this._tableColgroup = this.createColgroup();
        this._tableElement.append(this._tableColgroup);
        this._tableElement.append(this.createThead());

        parentElement.append(this._tableElement);

        this._dragHanlder = new dragHandler(this);
        this.readDataAndSet();
    }
    get DOMElement() {return this._tableElement;}
    get data() {return this._data;}
    get mode() {return this._tableType;}

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
    // getClassCells(classLevel) {
    //     return Array.from(this._tableElement.getElementsByClassName(this.HTMLPrefix + this.data.hierarchy[classLevel]));
    // }
    get tableColgroup() {return this._tableColgroup;}
    get tHeadLength() {return this._tableElement.tHead.children.length;}
    cellNum(cellFieldName) {//코드 관리를 위해 cellNum은 변수가 아닌 string을 바로 인자로 호출
        return this._itemCellComposition.indexOf(cellFieldName);
    }
    getItemIdx(elem) {
        var row  = elem.tagName == 'TR' ?  elem : elem.closest('tr');
        return Number(row.getAttribute('item-index'));
    }
    getRowPath(elem) {
        var row  = elem.tagName == 'TR' ?  elem : elem.closest('tr');
        return JSON.parse(row.getAttribute('path'));
    }
    snycCellToData(cell, feildData = cell.textContent) {//snyc from cell to data
        var itemPath = this.getRowPath(cell);
        var feildIdx = cell.getAttribute('feild-idx');
        this._data.setItemField(itemPath, feildIdx, feildData);
    }
    countClassRows(classPath) { //count including empty class row
        if(classPath.length == this._data._hierarchy.length){//lowest class
            return Math.max(1, this._data.countSubclasses(classPath))+1;//least 1 in empty case, add 1 for sumRow
        } else {//sum row count in subclasses
            var rowCount = 0;
            if(this._data.countSubclasses(classPath) == 0) rowCount = 1;
            else{
                for(let i = 0; i < this._data.countSubclasses(classPath); i++){
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

    //--Construstion function--
    applyTableType() {
        if(this._tableType[0] == 'planning' && this._tableType[1] == 'income'){
            this._dataHierarchy = null;
            this._dataItemFields = null;
            this._itemCellComposition = null;
            this._itemCellFieldMatch = null;
        }else if(this._tableType[0] == 'planning' && this._tableType[1] == 'expenditure'){
            this._dataHierarchy = null;
            this._dataItemFields = null;
            this._itemCellComposition = null;
            this._itemCellFieldMatch = null;
        }else if(this._tableType[0] == 'closing' && this._tableType[1] == 'income'){
            this._dataHierarchy = ['기구', '출처'];
            this._dataItemFields = ['항목', '코드', '예산', '결산', '집행률', '비고'];
            this._itemCellComposition = [this.DRAGHANDLE, '항목', '코드', '예산', '결산', '집행률', '비고'];
            this._itemCellFieldMatch = [null, 0, 1, 2, 3, 4, 5];
        }else if(this._tableType[0] == 'closing' && this._tableType[1] == 'expenditure'){
            this._dataHierarchy = ['기구', '담당', '대항목'];
            this._dataItemFields = ['항목', '출처', '코드', '예산', '결산', '집행률', '비고'];
            this._itemCellComposition = ['출처', this.DRAGHANDLE, '항목', '코드', '예산', '결산', '집행률', '비고'];
            this._itemCellFieldMatch = [1, null, 0, 2, 3, 4, 5, 6];
        }
    }
    createColgroup() {
        var colgroup = document.createElement('colgroup');
        for(var i = 0; i < this.data.hierarchy.length; i++) {
            if(this._tableType[1]==this.EXPENDITURE && i > 0) {
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
        if(this._tableType[1]==this.INCOME) title = '수입';
        else if(this._tableType[1]==this.EXPENDITURE) title = '지출';

        var addedColCount = 0;
        if(this._tableType[1]==this.EXPENDITURE) addedColCount = 2;

        firstRowTh.textContent = title;
        firstRowTh.setAttribute('colspan', this.data.hierarchy.length + this._itemCellComposition.length + addedColCount);
        firstRow.append(firstRowTh);

        var secondRow = document.createElement('tr');
        for(var i = 0; i < this.data.hierarchy.length; i++) {//class rows
            var td = document.createElement('td');
            td.textContent = this.data.hierarchy[i];
            td.classList.add(this.HTMLHeadPrefix + this.data.hierarchy[i]);
            secondRow.append(td);
            if(this._tableType[1]==this.EXPENDITURE && i > 0)
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
    calculatePercent(row) {
        if(row.getElementsByClassName(this.HTMLPrefix+this._data.itemFields[4]).length==0) return;//table load not done
        var budgetCell = row.getElementsByClassName(this.HTMLPrefix+'예산')[0];
        var settlementCell = row.getElementsByClassName(this.HTMLPrefix+'결산')[0];
        var percntCell = row.getElementsByClassName(this.HTMLPrefix+'집행률')[0];

        if(!percntCell) return;// percntCell doesn't exist while creating table

        if(budgetCell.hasAttribute('number-data') && settlementCell.hasAttribute('number-data')) {
            if(budgetCell.getAttribute('number-data') == 0) percntCell.textContent = '신설';
            else {
                var budget = Number(budgetCell.getAttribute('number-data'));
                var settlement = Number(settlementCell.getAttribute('number-data'));
                percntCell.textContent = parseFloat(settlement/budget*100).toFixed(2)+'%';
            }
        } else {percntCell.textContent = '';}
    }

    //--Sum--
    updatePartialSum(classPath) {
        var sumRow = document.getElementById(this.HTMLSumRowPrefix + classPath);
        var feilds = [this._itemCellComposition[this._itemCellComposition.length-4]
            ,this._itemCellComposition[this._itemCellComposition.length-3]];

        for(var i=0; i<2; i++) {
            var field = feilds[i];
            var sumCell = sumRow.getElementsByClassName(this.HTMLSumCellPrefix + field)[0];
            console.log(sumCell);
            var sum = null;

            if(classPath.length == this._data.hierarchy.length)//lowest level class
                sum = this._data.calcPartialSum(classPath, field);
            else{
                sum = 0;
                for(var j=0; j<this._data.countSubclasses(classPath); j++){
                    var childPath = classPath.concat(j);
                    var childClassSumRow = document.getElementById(this.HTMLSumRowPrefix + childPath);
                    var childClassSumCell = childClassSumRow.getElementsByClassName(this.HTMLSumCellPrefix + field)[0];
                    sum += parseInt(childClassSumCell.getAttribute('number-data'));
                }
            }
            sumCell.textContent = sum;
            sumCell.setAttribute('number-data', sum);
        }
    }
    bubbleUpdatePartialSum(classPath) {
        if(document.getElementById(this.HTMLSumRowPrefix + classPath).cells.length==0) return;//table load not done
        var classPathCopy = copyArray(classPath);
        while(0<classPathCopy.length) {
            this.updatePartialSum(copyArray(classPathCopy));
            classPathCopy.pop();
        }
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
        var itemPath = JSON.parse(amountCell.parentElement.getAttribute('path'));
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
        var itemFieldIdx = this._itemCellFieldMatch[itemCellIdx];
        if(itemCellIdx==-1) return;

        cell.textContent = this._data.getItem(itemPath)[itemFieldIdx];
        cell.setAttribute('feild-idx', itemFieldIdx);
        switch(itemCellType){
        case '항목'://항목
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
        cell.id = this.HTMLIDPrefix + classPath;
        cell.textContent = this._data.getClassName(classPath);
        cell.setAttribute('rowspan', Math.max(2, this.countClassRows(classPath)));
        cell.setAttribute('path', JSON.stringify(classPath));
        cell.classList.add(this.HTMLClassClass, 
                           this.HTMLPrefix + this.data.hierarchy[classPath.length-1], 
                           this.HTMLPrefix + classPath);
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
        if(this._tableType[1].localeCompare(this.EXPENDITURE) == 0) colPerHierarchyLevel = 2;
        return (this._data.hierarchy.length - classPath.length) * colPerHierarchyLevel + this._itemCellComposition.length;
    }
    createEmptyClassPlaceholderCell(row, classPath) {
        var cell = row.insertCell();
        cell.setAttribute('colspan', this.cntColInClass(classPath));
        cell.classList.add(this.EMPTYCELL);
        cell.textContent = 'empty';
        row.classList.add(this.EMPTYROW + '-' + classPath);
        row.classList.add(this.EMPTYROW);
        row.setAttribute('path', JSON.stringify(classPath));
    }
    createSumCells(rowPosition, classPath) {
        var row = this._tableElement.rows[rowPosition];
        var sumTitleCell = row.insertCell();
        var addedColCountInRest = 1;
        if(this._tableType[1]==this.EXPENDITURE) addedColCountInRest = 4-classPath.length;
        sumTitleCell.setAttribute('colspan', this.cntColInClass(classPath)-4);

        if(this._tableType[1]==this.INCOME) {
            if(classPath.length == 1) {
                sumTitleCell.textContent = "총계";
                sumTitleCell.classList.add(this.SUM('high'));
            }else{
                sumTitleCell.textContent = "계";
                sumTitleCell.classList.add(this.SUM('low'));
            }
        }else if(this._tableType[1]==this.EXPENDITURE) {
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
        if(classPath.length > 1 && this._tableType[1]==this.EXPENDITURE) {
            var dragCell = this.setFunctionCell(row.insertCell(), this.DRAGHANDLE, classPath).setAttribute('rowspan', Math.max(2, (this.countClassRows(classPath))));
        }
        var cell = this.setClassCell(row.insertCell(), classPath);
        if(classPath.length > 1 && this._tableType[1]==this.EXPENDITURE) cell.classList.add('no-left-border');
    }
    createCellsRecursion(rowPosition, classPath){
        var row = this._tableElement.rows[rowPosition];
        this.createClassCell(row, classPath);

        var childPosition = rowPosition;
        var childrenCount = this._data.countSubclasses(classPath);
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
        sumRow.id = this.HTMLSumRowPrefix + classPath;
        sumRow.classList.add(this.HTMLSumRowClass);
        sumRow.setAttribute('path', JSON.stringify(classPath));
    }
    createRowsRecursion(classPath) {
        var accTbody = this._tableElement.tBodies[0];
        if(this._data.countSubclasses(classPath) == 0){//class doesn't have subclass, empty
                var row = accTbody.insertRow();
                row.id = this.HTMLRowPrefix + classPath;
        }else if(classPath.length < this._data._hierarchy.length){//not lowest level class//recurse subclass
            for(let i = 0; i < this._data.countSubclasses(classPath); i++)
                this.createRowsRecursion(classPath.concat([i]));
        }else{//lowest level class
            for(var i = 0; i < this._data.countSubclasses(classPath); i++) {
                var itemPath = classPath.concat([i]);
                var row = accTbody.insertRow();
                row.id = this.HTMLRowPrefix + itemPath;
                row.setAttribute('path', JSON.stringify(itemPath));
                row.classList.add(this.HTMLItemClass);
            }
        }
        this.createSumRow(classPath);
    }
    readDataAndSet() {
        var accTbody = document.createElement('tbody');
        this._tableElement.append(accTbody);
        this.createRowsRecursion([0]);
        this._data.reassignItemCodes();
        var startingRowPosition = 2;//row that item starts
        this.createCellsRecursion(startingRowPosition, [0]);
        this._dragHanlder.setEvent();
    }
    rereadTable() { //Read and draw table again.
        this._tableElement.tBodies[0].remove();
        this.readDataAndSet();
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
var incomeTable1 = new accTable('income-table1', document.getElementById('ui-container'), ['closing','income'], incomeDataSource1);

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
var expenditureTable1 = new accTable('expenditure-table1', document.getElementById('ui-container'), ['closing','expenditure'], expenditureDataSource1);


//--Adding item--
function addNewItem() {
    //to be developed: add new item in data
}



document.getElementById('button').addEventListener('click', () => {
    incomeTable1.updatePartialSum([0,0]);
    incomeTable1.updatePartialSum([0,1]);
    incomeTable1.updatePartialSum([0,2]);
    incomeTable1.updatePartialSum([0]);
    incomeTable1.updatePartialSum([0]);
    //incomeTable1.rereadTable();
});

document.getElementById('reload-button').addEventListener('click', () => {
    incomeTable1.rereadTable();
});

document.getElementById('hide-button').addEventListener('click', () => {
    incomeTable1.toggleShowHideCol(document.getElementById('hide-target').value);
});



// $('table').hover(function(e){
//     if(  e.offsetX <= parseInt($(this).css('borderLeftWidth'))){
//         alert('hover on the left border!');
//     }
// });




