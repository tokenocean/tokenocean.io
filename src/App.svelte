<!-- App.svelte -->
<script>
  import { Router, Route } from "svelte-routing";



  // No Layout Pages
  import Index from "./views/Index.svelte";


  export let url = "";
</script>

<Router url="{url}">

  <!-- no layout pages -->

  <Route path="/" component="{Index}" />
</Router>
