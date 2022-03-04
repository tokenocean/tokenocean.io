<script>
  import { link } from "svelte-routing";
  import * as animateScroll from "svelte-scrollto";

  let navbarOpen = false;

  function setNavbarOpen() {
    navbarOpen = !navbarOpen;
  }
  const logo = "/assets/img/logo.png";
</script>

<nav
  class="top-0 absolute z-50 w-full flex flex-wrap items-center justify-between px-2 py-3 navbar-expand-lg"
>
  <div
    class="container px-4 mx-auto flex flex-wrap items-center justify-between"
  >
    <div
      class="w-full relative flex justify-between lg:w-auto lg:static lg:block lg:justify-start"
    >
      <a
        use:link
        class="text-white text-sm font-bold leading-relaxed inline-block mr-4 py-2 whitespace-nowrap uppercase"
        href="/"
      >
        <img src={logo} alt="" class="w-32" />
      </a>
      <button
        class="cursor-pointer text-xl leading-none px-3 py-1 border border-solid border-transparent rounded bg-transparent block lg:hidden outline-none focus:outline-none"
        type="button"
        on:click={setNavbarOpen}
      >
        <i class="text-white fas fa-bars" />
      </button>
    </div>
    <div
      class="lg:flex flex-grow items-center bg-blueGray-200 lg:bg-opacity-0 lg:shadow-none rounded shadow-lg {navbarOpen
        ? 'block'
        : 'hidden'}"
      id="example-navbar-warning"
    >
      <ul class="flex flex-col lg:flex-row list-none lg:ml-auto">
        <li class="flex items-center">
          <a
            class="lg:text-white lg:hover:text-blueGray-200 text-blueGray-700 px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold"
            href="https://twitter.com/tokenocean"
            target="_blank"
          >
            <i
              class="lg:text-blueGray-200 text-blueGray-700 fab fa-twitter text-lg leading-lg"
            />
            <span class="lg:hidden inline-block ml-2">Twitter</span>
          </a>
        </li>

        <li class="flex items-center">
          <a
            class="lg:text-white lg:hover:text-blueGray-200 text-blueGray-700 px-3 py-4 lg:py-2 flex items-center text-xs uppercase font-bold"
            href="https://github.com/tokenocean"
            target="_blank"
          >
            <i
              class="lg:text-blueGray-200 text-blueGray-700 fab fa-github text-lg leading-lg"
            />
            <span class="lg:hidden inline-block ml-2">GitHub</span>
          </a>
        </li>

        <li class="flex items-center">
          <button
            class="bg-blueGray-200 md:bg-white text-blueGray-700 active:bg-blueGray-50 text-xs font-bold uppercase px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none lg:mr-1 lg:mb-0 ml-3 mb-3 ease-linear transition-all duration-150"
            type="button"
            on:click={() => animateScroll.scrollTo({ element: "#book" })}
          >
            <i class="fas fa-handshake mr-1" /> Book a Consultation
          </button>
        </li>
      </ul>
    </div>
  </div>
</nav>
