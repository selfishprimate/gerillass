# frozen_string_literal: true

# Gerillass is a Sass library. The Ruby in this gem only tells a project where
# its stylesheets are, so that `@use "gerillass" as *;` resolves:
#
#   Rails    add the gem to the Gemfile; lib/gerillass/engine.rb puts the folder
#            on the asset paths, which dartsass-rails and dartsass-sprockets
#            pass to Sass as load paths.
#   Jekyll   add the gem to the :jekyll_plugins group or to `plugins:` in
#            _config.yml; lib/gerillass/jekyll.rb adds the folder to
#            sass.load_paths.
#   Ruby     pass Gerillass.load_path yourself, for example
#            Sass.compile("app.scss", load_paths: [Gerillass.load_path]).
module Gerillass
  # The folder that holds _gerillass.scss.
  def self.load_path
    File.expand_path("../scss", __dir__)
  end
end

# Each integration is loaded only when its framework is already loaded, so the
# gem adds nothing to a project that uses neither. Rails is loaded before
# Bundler.require in config/application.rb, and Jekyll requires its plugins after
# itself, so both are defined by the time this file is required.
require "gerillass/engine" if defined?(::Rails::Engine)
require "gerillass/jekyll" if defined?(::Jekyll::Hooks)
