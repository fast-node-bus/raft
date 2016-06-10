var isDebug = process.env.DEBUG;

module.exports=function(str){
    if(isDebug){
        console.log(new Date().toTimeString() + ': \x1b[33mDEBUG:\x1b[0m', str);
    }
};