# frozen_string_literal: true

module Gerillass
  # Tells Rails' Sass compiler where the library is. Each Sass setup reads its
  # load paths from a different place, so each gets the folder where it looks.
  #
  # dartsass-rails, the Sass setup for Propshaft, passes its build options to
  # Sass, so the folder goes in as --load-path. It would also accept the folder
  # on config.assets.paths (lib/dartsass/runner.rb passes those as load paths
  # too), but Propshaft copies everything on its asset paths into public/assets
  # when precompiling, which published all 109 of the library's .scss sources,
  # and Propshaft's excluded_paths cannot help: it removes the folder from
  # config.assets.paths as well. dartsass-rails splits build options on
  # whitespace, so a path containing a space falls back to the asset paths.
  #
  # dartsass-sprockets reads config.sass.load_paths on every compile
  # (lib/sassc/rails/template.rb). Appending to config.assets.paths after
  # initialization did not work there: sprockets-rails had already built its
  # environment from that list in its own after_initialize.
  #
  # Both of those are appended after initialization, so an app that assigns
  # config.dartsass.build_options or config.sass.load_paths in its own
  # initializers does not overwrite them. Anything else gets the folder on
  # config.assets.paths during initialization, before an asset environment is
  # built from it.
  class Engine < ::Rails::Engine
    initializer "gerillass.assets" do |app|
      next unless app.config.respond_to?(:assets)
      next if Gerillass::Engine.dartsass_rails?(app) || Gerillass::Engine.sass_load_paths?(app)

      app.config.assets.paths << Gerillass.load_path
    end

    config.after_initialize do |app|
      path = Gerillass.load_path

      if Gerillass::Engine.dartsass_rails?(app)
        option = "--load-path=#{path}"
        options = app.config.dartsass.build_options
        options << option unless options.include?(option)
      elsif Gerillass::Engine.sass_load_paths?(app)
        paths = app.config.sass.load_paths
        paths << path unless paths.map(&:to_s).include?(path)
      end
    end

    def self.dartsass_rails?(app)
      app.config.respond_to?(:dartsass) && !Gerillass.load_path.match?(/\s/)
    end

    def self.sass_load_paths?(app)
      app.config.respond_to?(:sass) && app.config.sass.respond_to?(:load_paths) && app.config.sass.load_paths.is_a?(Array)
    end
  end
end
