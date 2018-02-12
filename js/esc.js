const _ = require('lodash');
const Util = require('./util');

const Common = {
    INIT: "1B 40",//初始化
    
    ALIGN_LEFT: "1B 61 00",//左对齐
    ALIGN_RIGHT: "1B 61 02",//居右对齐
    ALIGN_CENTER: "1B 61 01",//居中对齐
    
    UNDER_LINE: "1C 2D 01",//下划线
    
    PRINT_AND_NEW_LINE: "0A",//打印并换行
    
    FONT_SMALL: "1B 4D 01",//小号字体 9x17
    FONT_NORMAL: "1B 4D 00",//正常 12x24
    FONT_BOLD: "1B 45 01",//粗体
    
    FONT_HEIGHT_TIMES: '1B 21 10',//选择倍高模式。打印瘦高字体
    FONT_WIDTH_TIMES: '1B 21 20',//选择倍宽模式，实际效果是字体变大，看上去更宽，高度似乎也有一点增高。粗体无效果。
    FONT_HEIGHT_WIDTH_TIMES: '1B 21 30',//字体放大
    
    SOUND: "1B 42 02 02",  // 蜂鸣 2次/100ms

    PRINT_AND_MOVE_PAPER:'1B 64 ' //打印缓冲区的内容，然后移动。后接数字，数字表示移动的行数

};

const Config = {
    wordNumber: 48 // 可打印的字数，对应80mm纸张
};

let writeTextToDevice, writeHexToDevice;

function _setBT(bt) {
    writeTextToDevice = bt.writeTextToDevice;
    writeHexToDevice = bt.writeHexToDevice;
}

function setConfig(config) {
    Object.assign(Config, config);
}

function leftRight(left, right, wordNumber = Config.wordNumber) {
    return left + Util.getSpace(wordNumber - Util.getWordsLength(left) - Util.getWordsLength(right)) + right;
}

function keyValue(name, value, wordNumber = Config.wordNumber) {
    const nameLen = Util.getWordsLength(name);
    let vArr = [], temp = '';
    _.each(value, (v, i) => {
        const tvLen = Util.getWordsLength(temp + v);
        const diff = tvLen - (wordNumber - nameLen);
        if (diff <= 0) {
            temp += v;
            if (i === value.length - 1) {
                vArr.push(temp);
            }
        } else {
            if (Util.isChinese(v) && diff === 1) {
                temp += ' ';
            }
            vArr.push(temp);
            temp = v;
        }
    });
    return _.map(vArr, (v, i) => {
        if (i === 0) {
            return name + v;
        } else {
            return Util.getSpace(name.length) + v;
        }
    }).join('');
}

const ESC = {
    Common,
    Util: {
        leftRight,
        keyValue,
    },
    _setBT,
    setConfig,
    
    init(){
        writeHexToDevice(Common.INIT);
    },
    printAndNewLine(){
        writeHexToDevice(Common.PRINT_AND_NEW_LINE);
    },
    alignLeft(){
        writeHexToDevice(Common.ALIGN_LEFT);
    },
    alignCenter(){
        writeHexToDevice(Common.ALIGN_CENTER);
    },
    alignRight(){
        writeHexToDevice(Common.ALIGN_RIGHT);
    },
    
    underline(){
        writeHexToDevice(Common.UNDER_LINE);
    },
    
    fontSmall(){
        writeHexToDevice(Common.FONT_SMALL);
    },
    fontNormal(){
        writeHexToDevice(Common.FONT_NORMAL);
    },
    fontBold(){
        writeHexToDevice(Common.FONT_BOLD);
    },
    
    fontHeightTimes(){
        writeHexToDevice(Common.FONT_HEIGHT_TIMES);
    },
    fontWidthTimes(){
        writeHexToDevice(Common.FONT_WIDTH_TIMES);
    },
    fontHeightWidthTimes(){
        writeHexToDevice(Common.FONT_HEIGHT_WIDTH_TIMES);
    },
    
    text(str){
        writeTextToDevice(str)
    },
    
    sound(){
        writeHexToDevice(Common.SOUND);
    },
    numberToHexString(num){
        let num2=Math.floor(num)//向下取整
        return num2<16?('0'+num2.toString(16)):num2.toString(16)
    },
    printAndMovePaper(moveLineNum){
        let lineNum=Math.floor(moveLineNum)//向下取整
        if(lineNum>=0&&lineNum<=255){
            let hexStr=this.numberToHexString(lineNum)
            let cmd=Common.PRINT_AND_MOVE_PAPER+hexStr;
            console.log('cmd',cmd)
            writeHexToDevice(cmd);
        }else{
            this.printAndNewLine()
        }
    },
    movePaper(step){
        //默认情况下 1 step 是 1/200 英寸。可以通过 GS P修改步长
        //对于200DPI的情况，字高约3mm。1mm，step约7.8
        let cmd='1B 4A '+this.numberToHexString(step);
        writeHexToDevice(cmd);
    },
    sendHorizontalTab(){
        //效果和在记事本中按TAB键差不多。
        //默认是8个ASCII字符宽度为列宽。如果前面宽度是8的倍数，则向后跳8，否则跳到下一个8的倍数的位置。
        //默认水平点，可以通过ESC D命令设置
        writeHexToDevice('09');
    },
    selectFontSmall(){//修改为 9x17 大小，默认是 12x24。经过测试对汉字无效。
        writeHexToDevice('1B 4D 01');
    },
    setQrCodeSize(size){//设置二维码图片的大小，默认是3，比较小。
        let cmd = '1d 28 6b 03 00 31 43 '+this.numberToHexString(size)
        writeHexToDevice(cmd)
    },
    printQrCode(qrCodeStr){
        if(qrCodeStr.length==0){
            return 
        }
        let positionHigh=this.numberToHexString((qrCodeStr.length+3)/256) 
        let positionLow=this.numberToHexString((qrCodeStr.length+3)%256) 
        let cmd = '1d 28 6b '+positionLow+' '+positionHigh+' 31 50 30'
        writeHexToDevice(cmd)
        this.text(qrCodeStr)
        let cmdPrint='1d 28 6b 03 00 31 51 30'
        writeHexToDevice(cmdPrint)
    }
};

module.exports = ESC;
