package org.openapitools

import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.RequestMapping

/**
 * Home redirection to OpenAPI api documentation
 */
@Controller
class HomeController {
	@RequestMapping("/")
	fun index(): String = "redirect:swagger-ui.html"
}
