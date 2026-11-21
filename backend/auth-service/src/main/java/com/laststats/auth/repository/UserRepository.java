package com.laststats.auth.repository;

import com.laststats.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
<<<<<<< HEAD
import java.util.Optional;
import java.util.UUID;

// JpaRepository gives us .save(), .findById(), .findAll() for FREE
// We only need to declare the EXTRA queries we want
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

=======

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
>>>>>>> e9f8f2f59371c40a8f4683f814af5d7ef8ee7e99
    boolean existsByEmail(String email);
}
