<script setup>
import { Form } from "vee-validate";
import * as Yup from "yup";
import TextInput from "./TextInput.vue";

function onSubmit(values) {
  alert(JSON.stringify(values, null, 2));
}

function onInvalidSubmit() {
  const submitBtn = document.querySelector(".submit-btn");
  submitBtn.classList.add("invalid");
  setTimeout(() => {
    submitBtn.classList.remove("invalid");
  }, 1000);
}

// Using yup to generate a validation schema
// https://vee-validate.logaretm.com/v4/guide/validation#validation-schemas-with-yup
const schema = Yup.object().shape({
  name: Yup.string().required(),
  email: Yup.string().email().required(),
  password: Yup.string().min(6).required(),
  confirm_password: Yup.string()
    .required()
    .oneOf([Yup.ref("password")], "Passwords do not match"),
});
</script>

<template>
  <div>
    <Form
      @submit="onSubmit"
      :validation-schema="schema"
      @invalid-submit="onInvalidSubmit"
    >
      <TextInput
        name="name"
        type="text"
        label="Full Name"
        persistent-placeholder
        placeholder="Your Name"
        success="Nice to meet you!"
      />
      <TextInput
        name="email"
        type="email"
        label="E-mail"
        persistent-placeholder
        placeholder="Your email address"
        success-message="Got it, we won't spam you!"
      />
      <TextInput
        name="password"
        type="password"
        label="Password"
        persistent-placeholder
        placeholder="Your password"
        success-message="Nice and secure!"
      />
      <TextInput
        name="confirm_password"
        type="password"
        label="Confirm Password"
        persistent-placeholder
        placeholder="Type it again"
        success-message="Glad you remembered it!"
      />
      <v-btn type="submit" class="submit-btn" color="primary">Submit</v-btn>
    </Form>
  </div>
</template>
