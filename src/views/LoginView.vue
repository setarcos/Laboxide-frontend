<template>
  <div class="redirect-container">
    <h2>{{ $t("message.loginservice") }}</h2>
    <p>{{ $t("message.redirect") }}</p>

    <!--
      This form is completely hidden and is submitted automatically by the script.
      We use a `ref` to get a direct handle to this DOM element from our script.
    -->
    <form
      ref="loginFormRef"
      :action="iaaaConfig.url"
      method="post"
      style="display: none"
    >
      <input type="hidden" name="appID" :value="iaaaConfig.appId" />
      <input type="hidden" name="appName" :value="iaaaConfig.appName" />
      <input type="hidden" name="redirectUrl" :value="iaaaConfig.redirectUrl" />
    </form>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

// Create a ref to link to our form element in the template
const loginFormRef = ref(null);

// Configuration for the IAAA POST request
const iaaaConfig = {
  url: "https://iaaa.pku.edu.cn/iaaa/oauth.jsp",
  appId: "EELABWeb",
  appName: "基础教学实验中心",
  redirectUrl: "http://162.105.91.8/auth/",
};

// The onMounted hook is the key. It runs once the component's
// template has been rendered to the DOM.
onMounted(() => {
  // By now, the `loginFormRef` is attached to the actual <form> element.
  // We can now trigger its submit() method to initiate the POST request
  // and redirect the user's browser.
  if (loginFormRef.value) {
    loginFormRef.value.submit();
  } else {
    console.error(
      "Could not find the login form to submit. Redirect will not occur.",
    );
  }
});
</script>

<style scoped>
.redirect-container {
  text-align: center;
  padding-top: 5rem;
  color: #555;
}
</style>
