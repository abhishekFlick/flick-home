package com.flickmatch.platform.graphql.controller;

import com.flickmatch.platform.dynamodb.model.User;
import com.flickmatch.platform.graphql.builder.UserBuilder;
import com.flickmatch.platform.graphql.input.CreateUserInput;
import com.flickmatch.platform.graphql.type.UserResult;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@Log4j2
public class UserController {

    @Autowired
    private UserBuilder userBuilder;

    @MutationMapping
    public UserResult createUser(@Argument CreateUserInput input) {
        try {
            User newUser = userBuilder.createUser(input);
            return UserResult.builder()
                    .isSuccessful(true)
                    .userId(newUser.getUserId())
                    .build();
        } catch (Exception exception) {
            log.error(exception.getMessage());
            return UserResult.builder()
                    .isSuccessful(false)
                    .build();
        }


    }
        @QueryMapping(name="users")
        public List<User> getAllUsers() {
            return userBuilder.getAllUsers();
        }

              
}
