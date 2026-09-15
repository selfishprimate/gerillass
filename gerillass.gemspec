# frozen_string_literal: true

require "json"

# The gem is the same library as the npm package, not a port: it ships the
# scss/ folder untouched, the two files written for coding agents
# (gerillass.json and SKILL.md), and a few lines of Ruby that tell Rails, Jekyll
# or a plain Sass compile where that folder is. See lib/gerillass.rb.
#
# The version is read from package.json so the two packages can never drift.
#
# This file is kept to ASCII. RubyGems reads a gemspec in the locale's encoding,
# so with an ASCII locale the dotted capital I in the name failed to load,
# `Invalid gemspec: "\xC4" on US-ASCII`, and an `# encoding: utf-8` line did not
# help. The author's name
# is written with \u escapes, which make a UTF-8 string in any locale, and
# package.json is read as UTF-8 explicitly.
package = JSON.parse(File.read(File.join(__dir__, "package.json"), encoding: "UTF-8"))

Gem::Specification.new do |spec|
  spec.name = "gerillass"
  spec.version = package.fetch("version")
  spec.authors = ["Halil İbrahim Çakıroğlu"]
  spec.summary = "Sass mixins and functions for Rails, Jekyll and any Ruby project that compiles Sass."
  spec.description = package.fetch("description")
  spec.homepage = "https://gerillass.com"
  spec.license = "Apache-2.0"

  spec.metadata = {
    "homepage_uri" => "https://gerillass.com",
    "documentation_uri" => "https://gerillass.com/docs/introduction",
    "source_code_uri" => "https://github.com/selfishprimate/gerillass",
    "changelog_uri" => "https://github.com/selfishprimate/gerillass/blob/main/CHANGELOG.md",
    "bug_tracker_uri" => "https://github.com/selfishprimate/gerillass/issues",
    "rubygems_mfa_required" => "true"
  }

  # Globbed from the gemspec's own folder, so the list is the same whether
  # `gem build` or Bundler evaluates it.
  spec.files = Dir.chdir(__dir__) do
    Dir["scss/**/*.scss", "lib/**/*.rb", "gerillass.json", "SKILL.md", "LICENSE.md", "README.md"]
  end
  spec.require_paths = ["lib"]

  # Deliberately no runtime dependencies. Each project brings its own Sass:
  # dartsass-rails or dartsass-sprockets in Rails, jekyll-sass-converter in
  # Jekyll, sass-embedded anywhere else. The library needs Dart Sass; LibSass
  # (sassc, sass-rails, sassc-rails) cannot compile its @use and @forward.
end
