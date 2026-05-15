package com.tr.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.bind.annotation.GetMapping;

@SpringBootTest
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

	@GetMapping("/")
public String home() {
    return "API TR online";
}

}
