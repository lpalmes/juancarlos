"use strict";

const del = require("del");
const fs = require("fs");
const gulp = require("gulp");
const path = require("path");

const RELEASE_COMMIT_SHA = process.env.RELEASE_COMMIT_SHA;
if (RELEASE_COMMIT_SHA && RELEASE_COMMIT_SHA.length !== 40) {
  throw new Error(
    "If the RELEASE_COMMIT_SHA env variable is set, it should be set to the " +
      "40 character git commit hash."
  );
}

const VERSION = RELEASE_COMMIT_SHA
  ? `0.0.0-main-${RELEASE_COMMIT_SHA.substr(0, 8)}`
  : process.env.npm_package_version;

const DIST = "dist";
const clean = () => del(DIST);

const rustPackage = gulp.parallel(
  function copyPackageFiles() {
    return gulp
      .src(["package.json", "cli.js", "index.js"], {
        cwd: path.join("juan-carlos-npm"),
      })
      .pipe(gulp.dest(path.join(DIST, "juan-carlos")));
  },
  function copyCompilerBins() {
    return gulp
      .src("**", {
        cwd: path.join("artifacts"),
      })
      .pipe(gulp.dest(path.join(DIST, "relay-compiler")));
  }
);

async function setCompilerMainVersion() {
  if (!RELEASE_COMMIT_SHA) {
    throw new Error("Expected the RELEASE_COMMIT_SHA env variable to be set.");
  }
  const currentVersion = require("./package.json").version;
  const compilerCargoFile = path.join(".", "lsp", "Cargo.toml");
  const cargo = fs.readFileSync(compilerCargoFile, "utf8");
  const updatedCargo = cargo.replace(
    `version = "${currentVersion}"`,
    `version = "${VERSION}"`
  );
  fs.writeFileSync(compilerCargoFile, updatedCargo, "utf8");
}

const cleanbuild = gulp.series(clean);

exports.clean = clean;
exports.mainrelease = gulp.series(cleanbuild, rustPacakge, setMainVersion);
exports.release = gulp.series(cleanbuild, rustPackage);
exports.cleanbuild = cleanbuild;
exports.default = cleanbuild;
exports.setCompilerMainVersion = setCompilerMainVersion;