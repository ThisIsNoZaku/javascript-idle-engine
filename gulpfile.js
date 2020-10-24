const { src, dest, series, watch } = require("gulp");
const ts = require("gulp-typescript");
const del = require("del");
const tsProject = ts.createProject("tsconfig.json");

function watchBuild() {
    watch("src/*.ts");
}

exports.watchBuild = watchBuild;

function build() {
    var tsCompileResult = tsProject.src().pipe(tsProject());
    return tsCompileResult.js.pipe(dest("dist"));
}
exports.build = build;

function clean(cb) {
    return del(['dist', 'src/**/*.js', 'tests/**/*.js'], cb);
}
exports.clean = clean;
exports.default = series(clean, build);