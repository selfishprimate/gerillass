# frozen_string_literal: true

# Adds the library's scss/ folder to Jekyll's Sass load paths.
#
# jekyll-sass-converter reads sass.load_paths from the site configuration when
# it first converts a stylesheet, and expands each entry with File.expand_path,
# so an absolute path outside the site works. In safe mode it would confine
# every path to the site source, but plugins do not run in safe mode anyway.
Jekyll::Hooks.register :site, :after_init do |site|
  sass = (site.config["sass"] ||= {})
  paths = Array(sass["load_paths"])
  sass["load_paths"] = paths + [Gerillass.load_path] unless paths.include?(Gerillass.load_path)
end
