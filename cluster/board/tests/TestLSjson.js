var TestLSjson;
TestLSjson = new function () {
    this.testGenerateNodeName = function () {
        this.clear();
        console.log("------ testGenerateNodeName -------");
        console.log(LS.json.getJsonStr());
        var generatedNodeName;
        for (var i = 0; i < 10; i++) {
            console.log("generatedNodeName = LS.json.nodes.generateName();");
            generatedNodeName = LS.json.nodes.generateName();
            console.log('generatedNodeName=' + generatedNodeName);
            console.log("LS.json.nodes.add(generatedNodeName, 'blah blah');");
            LS.json.nodes.add(generatedNodeName, 'blah blah');
            console.log(LS.json.getJsonStr());
        }
    };

    this.testChangeNodeName = function () {
        this.clear();
        console.log("------ testChangeNodeName -------");
        console.log(LS.json.getJsonStr());
        console.log("LS.json.nodes.add('A', 'blah blah');");
        LS.json.nodes.add('A', 'blah blah');
        console.log(LS.json.getJsonStr());
        console.log("LS.json.nodes.changeName('A', 'B');");
        LS.json.nodes.changeName('A', 'B');
        console.log(LS.json.getJsonStr());
    };

    this.testRemoveNode = function () {
        this.clear();
        console.log("------ testRemoveNode -------");
        console.log(LS.json.getJsonStr());
        console.log("LS.json.nodes.add('A', 'blah blah');");
        LS.json.nodes.add('A', 'blah blah');
        console.log(LS.json.getJsonStr());
        console.log("LS.json.nodes.remove('A');");
        LS.json.nodes.remove('A');
        console.log(LS.json.getJsonStr());
    };

    this.testExecPath = function () {
        this.clear();
        console.log("------ testExecPath -------");
        console.log(LS.json.getJsonStr());
        console.log("LS.json.nodes.add('A', 'blah blah');");
        LS.json.nodes.add('A', 'blah blah');
        console.log(LS.json.getJsonStr());
        console.log("LS.json.nodes.setExecPath('A', 'abc');");
        LS.json.nodes.setExecPath('A', 'abc');
        console.log(LS.json.getJsonStr());
        console.log("LS.json.nodes.getExecPath('A')");
        console.log(LS.json.nodes.getExecPath('A'));
    };

    this.testArgs = function () {
        this.clear();
        console.log("------ testArgs -------");
        console.log(LS.json.getJsonStr());
        console.log("LS.json.nodes.add('A', 'blah blah');");
        LS.json.nodes.add('A', 'blah blah');
        console.log(LS.json.getJsonStr());
        console.log("LS.json.nodes.setArgs('A', 'abc');");
        LS.json.nodes.setArgs('A', 'abc');
        console.log(LS.json.getJsonStr());
        console.log("LS.json.nodes.getArgs('A')");
        console.log(LS.json.nodes.getArgs('A'));
    };

    this.testGetAllNodes = function () {
        this.clear();
        console.log("------ testGetAllNodes -------");
        console.log("LS.json.nodes.add('A', 'sample_path');");
        console.log("LS.json.nodes.add('B', 'sample_path');");
        console.log("LS.json.nodes.add('C', 'sample_path');");
        LS.json.nodes.add('A', 'sample_path');
        LS.json.nodes.add('B', 'sample_path');
        LS.json.nodes.add('C', 'sample_path');
        console.log("LS.json.nodes.getAll()");
        console.log(LS.json.nodes.getAll());
    };

    this.testGetJson = function () {
        this.clear();
        console.log("------ testGetJson -------");
        console.log("LS.json.nodes.add('A', 'sample_path');");
        console.log("LS.json.nodes.add('B', 'sample_path');");
        console.log("LS.json.nodes.add('C', 'sample_path');");
        LS.json.nodes.add('A', 'sample_path');
        LS.json.nodes.add('B', 'sample_path');
        LS.json.nodes.add('C', 'sample_path');
        console.log("LS.json.getJson()");
        console.log(LS.json.getJson());
    };

    this.testAddFile = function () {
        this.clear();
        console.log("------ testAddFile -------");
        console.log("LS.json.nodes.add('A', 'sample_path');");
        LS.json.nodes.add('A', 'sample_path');
        console.log(LS.json.getJsonStr());
        console.log("LS.json.files.add('A', 'stdout', '');");
        LS.json.files.add('A', 'stdout', '');
        console.log(LS.json.getJsonStr());
    };

    this.testRemoveFile = function () {
        this.clear();
        console.log("------ testRemoveFile -------");
        console.log("LS.json.nodes.add('A', 'sample_path');");
        LS.json.nodes.add('A', 'sample_path');
        console.log(LS.json.getJsonStr());
        console.log("LS.json.files.add('A', 'stdout', '');");
        LS.json.files.add('A', 'stdout', '');
        console.log(LS.json.getJsonStr());
        console.log("LS.json.files.remove('A', 'stdout');");
        LS.json.files.remove('A', 'stdout');
        console.log(LS.json.getJsonStr());
    };

    this.testFilePath = function () {
        this.clear();
        console.log("------ testFilePath -------");
        console.log("LS.json.nodes.add('A', 'sample_path');");
        LS.json.nodes.add('A', 'sample_path');
        console.log(LS.json.getJsonStr());
        console.log("LS.json.files.add('A', 'stdout', '');");
        LS.json.files.add('A', 'stdout', '');
        console.log(LS.json.getJsonStr());
        console.log("LS.json.files.setPath('/path1'');");
        LS.json.files.setPath('/path1');
        console.log(LS.json.getJsonStr());
    };

    this.testChangeDevice = function () {
        this.clear();
        console.log("------ testChangeDevice -------");
        console.log("LS.json.nodes.add('A', 'sample_path');");
        LS.json.nodes.add('A', 'sample_path');
        console.log(LS.json.getJsonStr());
        console.log("LS.json.files.add('A', 'stdout', '');");
        LS.json.files.add('A', 'stdout', '');
        console.log(LS.json.getJsonStr());
        console.log("LS.json.files.changeDevice('A', 'stdout', 'stdin');");
        LS.json.files.changeDevice('A', 'stdout', 'stdin');
        console.log(LS.json.getJsonStr());
    };

    this.testEnv = function () {

    };

    this.clear = function () {
        LS.json.nodes.removeAll();
    };
};
TestLSjson.testGenerateNodeName();
TestLSjson.testChangeNodeName();
TestLSjson.testExecPath();
TestLSjson.testRemoveNode();
TestLSjson.testArgs();
TestLSjson.testGetAllNodes();
TestLSjson.testGetJson();
TestLSjson.testAddFile();
TestLSjson.testRemoveFile();
TestLSjson.testFilePath();
TestLSjson.testChangeDevice();
TestLSjson.testEnv();