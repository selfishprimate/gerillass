import React from "react";

import "./product-hunt.scss";

function ProductHunt() {
  return (
    <div className="product-hunt padding--global">
      <span className="product-hunt__label">Gerillass is featured on Product Hunt now!</span>
      <a href="https://www.producthunt.com/posts/gerillass?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-gerillass" target="_blank" rel="noopener noreferrer"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=223093&theme=dark" alt="Gerillass - Sass mixins to help you create better user interfaces. | Product Hunt Embed" style={{"width": "250px", "height": "54px"}} width="250px" height="54px" /></a>
    </div>
  )
}

export default ProductHunt;
