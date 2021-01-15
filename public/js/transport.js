self.addEventListener('message', function(dataToSend) {
    // 
    // self.postMessage("OK");
    // console.log("SENT");
    self.close();
});