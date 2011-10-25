
export("TextFile");

function TextFile(charset) {

    this.charset = charset || "UTF-8";
    this.unflushed = false;
};


/**
 *
 */
TextFile.prototype.getReader = function() {

    if (!this.bfr) {
        this.fis = new java.io.FileInputStream(this.raf.getFD());
        this.isr = new java.io.InputStreamReader(this.fis, this.charset);
        this.bfr= new java.io.BufferedReader(this.isr);
    }
    return this.bfr;
};


/**
 *
 */
TextFile.prototype.getWriter = function() {

    if (!this.bfw) {
        this.fos = new java.io.FileOutputStream(this.raf.getFD());
        this.osw = new java.io.OutputStreamWriter(this.fos, this.charset);
        this.bfw= new java.io.BufferedWriter(this.osw);
    }
    return this.bfw;
};

/**
 *
 */
TextFile.prototype.open = function(file_name, charset) {

    this.charset = charset || this.charset;

    this.raf = new java.io.RandomAccessFile(file_name, "rw");
    return this.raf;
};


/**
 *
 */
TextFile.prototype.close = function() {

    this.flush();
    return this.raf.close();
};


/**
 *
 */
TextFile.prototype.seek = function(position) {

    //print(module.id, "seek", position);

    if (this.bfr) {
        delete this.bfr;
        //this.getReader();
    }
    return this.raf.seek(position);
};


/**
 *
 */
TextFile.prototype.position = function() {

    return this.raf.getFilePointer();
};


/**
 *
 */
TextFile.prototype.flush = function(force) {

    //print(module.id, "flush", this.unflushed, force);

    if (this.unflushed || force) {
        this.getWriter().flush();
        this.unflushed = false;
    }
};


/**
 *
 */
TextFile.prototype.readLine = function() {

    this.unflushed && this.flush();

    return this.getReader().readLine();
};


/**
 *
 */
TextFile.prototype.read = function(pos, len) {

    this.unflushed && this.flush();

    if (pos || pos === 0) {
        this.seek(pos);
    }

    var cb = new java.lang.String(ByteArray(len), "ascii").toCharArray();
    this.getReader().read(cb, 0, len);
    return new String(new java.lang.String(cb));
};


/**
 *
 */
TextFile.prototype.write = function(str) {

    this.getWriter().write(str, 0, str.length);
    this.flush(true);
};


/**
 *
 */
TextFile.prototype.writeLine = function(str) {

    this.getWriter().write(str, 0, str.length);
    this.getWriter().newLine();
    this.flush(true);
};


/**
 *
 */
TextFile.prototype.appendLine = function(str) {

    this.seek(this.raf.length());
    return this.writeLine(str);
};
