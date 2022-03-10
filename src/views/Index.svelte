<script>
  import { link } from "svelte-routing";

  // core components
  import AuthNavbar from "components/Navbars/AuthNavbar.svelte";
  import Footer from "components/Footers/Footer.svelte";

  const raretoshi = "/assets/img/raretoshi.png";
  const rare = "/assets/img/rare.png";
  const playboy = "/assets/img/playboy.png";
  const silo = "/assets/img/silo.png";
  const nftglee = "/assets/img/nftglee.png";
  const blockstream = "/assets/img/blockstream.png";
  const server = "/assets/img/server.jpg";
  const kris = "/assets/img/kris.jpg";
  const adam = "/assets/img/adam.jpg";
  const ocean = "/assets/img/ocean.jpg";
</script>

<div>
  <AuthNavbar />
  <main>
    <div
      class="relative pt-16 pb-32 flex content-center items-center justify-center min-h-screen-75"
    >
      <div
        class="absolute top-0 w-full h-full bg-center bg-cover"
        style="
          background-image: url({ocean});
        "
      >
        <span
          id="blackOverlay"
          class="w-full h-full absolute opacity-50 bg-black"
        />
      </div>
      <div class="container relative mx-auto">
        <div class="items-center flex flex-wrap">
          <div class="w-full lg:w-6/12 px-4 ml-auto mr-auto text-center">
            <div class="md:pr-12">
              <h1 class="text-white font-semibold text-5xl">
                We Make it Easy For Brands to Leverage NFT’s.
              </h1>
              <p class="mt-4 text-lg text-blueGray-200">
                We are a <span class="text-brightgreen">white label</span>
                provider of <span class="text-brightgreen">bitcoin</span> based
                <span class="text-brightgreen">NFT marketplaces</span>. Book a
                consultation with us to learn how you can leverage NFT’s for
                your business.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div
        class="top-auto bottom-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden h-70-px"
        style="transform: translateZ(0);"
      >
        <svg
          class="absolute bottom-0 overflow-hidden"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          version="1.1"
          viewBox="0 0 2560 100"
          x="0"
          y="0"
        >
          <polygon
            class="text-blueGray-200 fill-current"
            points="2560 0 2560 100 0 100"
          />
        </svg>
      </div>
    </div>

    <section class="pb-20 bg-blueGray-200 -mt-24">
      <div class="container mx-auto px-4">
        <div class="flex flex-wrap">
          <div class="lg:pt-12 pt-6 w-full md:w-4/12 px-4 text-center">
            <div
              class="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-lg rounded-lg"
            >
              <div class="px-4 py-5 flex-auto">
                <div
                  class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-secondary"
                >
                  <i class="fab fa-bitcoin" />
                </div>
                <h6 class="text-xl font-semibold">
                  Bitcoin Only & Open Source
                </h6>
                <p class="mt-2 mb-4 text-blueGray-500">
                  We leverage the Liquid Network, a bitcoin layer-2 solution to
                  utilize the world's leading and original decentralized
                  blockchain. All of our code is fully auditable.
                </p>
              </div>
            </div>
          </div>

          <div class="w-full md:w-4/12 px-4 text-center">
            <div
              class="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-lg rounded-lg"
            >
              <div class="px-4 py-5 flex-auto">
                <div
                  class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-secondary"
                >
                  <i class="fas fa-toolbox" />
                </div>
                <h6 class="text-xl font-semibold">White Label Service</h6>
                <p class="mt-2 mb-4 text-blueGray-500">
                  We offer a full suite of development services making it
                  possible to realize your vision and provide ongoing
                  maintenance if requested.
                </p>
              </div>
            </div>
          </div>

          <div class="pt-6 w-full md:w-4/12 px-4 text-center">
            <div
              class="relative flex flex-col min-w-0 break-words bg-white w-full mb-8 shadow-lg rounded-lg"
            >
              <div class="px-4 py-5 flex-auto">
                <div
                  class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 mb-5 shadow-lg rounded-full bg-secondary"
                >
                  <i class="fas fa-chalkboard-teacher" />
                </div>
                <h6 class="text-xl font-semibold">Decades of Experience</h6>
                <p class="mt-2 mb-4 text-blueGray-500">
                  Our team are experts in privacy, security, development, and
                  distributed networks.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center mt-16 md:mt-32">
          <div class="w-full md:w-5/12 px-4 mr-auto ml-auto">
            <div
              class="text-white p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-secondary"
            >
              <i class="fas fa-user-friends text-xl" />
            </div>
            <h3 class="text-3xl mb-2 font-semibold leading-normal">
              Your Own Marketplace
            </h3>
            <p
              class="text-lg font-light leading-relaxed mt-4 mb-4 text-blueGray-600"
            >
              Control your own brand and destiny and leverage your current
              online presence.
            </p>
          </div>

          <div class="w-full md:w-1/2 lg:w-4/12 px-4 mr-auto ml-auto">
            <div
              class="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-secondary"
            >
              <img
                alt="..."
                src={raretoshi}
                class="w-full align-middle rounded-t-lg"
              />
              <blockquote class="relative px-8 py-4 mb-4">
                <ul class="text-md leading-relaxed text-white list-disc custom">
                  <h4 class="mb-3 text-xl font-bold text-white">Features</h4>
                  <li>Royalty distribution</li>
                  <li>An entirely new marketing campaign opportunity</li>
                  <li>Secondary market opportunities</li>
                  <li>Special access, community, DAO, memberships</li>
                </ul>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="relative py-20">
      <div
        class="bottom-auto top-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden -mt-20 h-20"
        style="transform: translateZ(0);"
      >
        <svg
          class="absolute bottom-0 overflow-hidden"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          version="1.1"
          viewBox="0 0 2560 100"
          x="0"
          y="0"
        >
          <polygon
            class="text-white fill-current"
            points="2560 0 2560 100 0 100"
          />
        </svg>
      </div>

      <div class="container mx-auto px-4">
        <div class="items-center flex flex-wrap">
          <div class="w-full md:w-1/2 lg:w-4/12 ml-auto mr-auto px-4">
            <img
              alt="..."
              class="max-w-full rounded-lg shadow-lg"
              src={server}
            />
          </div>
          <div class="mt-10 md:mt-0 w-full md:w-5/12 ml-auto mr-auto px-4">
            <div class="md:pr-12">
              <div
                class="text-black p-3 text-center inline-flex items-center justify-center w-16 h-16 mb-6 shadow-lg rounded-full bg-brightgreen"
              >
                <i class="fas fa-laptop text-xl" />
              </div>
              <h3 class="text-3xl font-semibold">Hassle Free Tech</h3>
              <p class="mt-4 text-lg leading-relaxed text-blueGray-500">
                We make sure your systems stay up and running so you don't have
                to.
              </p>
              <ul class="list-none mt-6">
                <li class="py-2">
                  <div class="flex items-center">
                    <div>
                      <span
                        class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-black bg-brightgreen mr-3"
                      >
                        <i class="fas fa-brain" />
                      </span>
                    </div>
                    <div>
                      <h4 class="text-blueGray-500">
                        You benefit from our knowledge of the bitcoin and NFT
                        industries
                      </h4>
                    </div>
                  </div>
                </li>
                <li class="py-2">
                  <div class="flex items-center">
                    <div>
                      <span
                        class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-black bg-brightgreen mr-3"
                      >
                        <i class="far fa-paper-plane" />
                      </span>
                    </div>
                    <div>
                      <h4 class="text-blueGray-500">
                        Full-phase project implementation and maintenance
                      </h4>
                    </div>
                  </div>
                </li>
                <li class="py-2">
                  <div class="flex items-center">
                    <div>
                      <span
                        class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-black bg-brightgreen mr-3"
                      >
                        <i class="fab fa-js-square" />
                      </span>
                    </div>
                    <div>
                      <h4 class="text-blueGray-500">
                        Expertise in design, development, deployment and scaling
                      </h4>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="customborder border-y-8 border-offblack bg-primary py-32">
      <h2 class="text-4xl font-semibold text-center mb-10 text-blueGray-500">
        Companies we have worked with
      </h2>
      <div class="flex justify-center items-center">
        <div
          class="block lg:flex justify-center items-center space-y-20 px-4 lg:space-y-0 lg:space-x-10 xl:space-x-20"
        >
          <img src={rare} alt="" class="mx-auto" />
          <img src={playboy} alt="" class="mx-auto" />
          <img src={silo} alt="" class="mx-auto" />
          <img src={nftglee} alt="" class="mx-auto" />
          <img src={blockstream} alt="" class="mx-auto" />
        </div>
      </div>
    </section>

    <section class="pt-20 pb-20 md:pb-48">
      <div class="container mx-auto px-4">
        <div class="flex flex-wrap justify-center text-center mb-24">
          <div class="w-full lg:w-6/12 px-4">
            <h2 class="text-4xl font-semibold">About Us</h2>
            <p class="text-lg leading-relaxed m-4 text-blueGray-500">
              Kris Constable and Adam Soltys - the co-founders of tokenocean.io,
              founded the first bitcoin-based white label NFT marketplace in the
              world by using the Liquid Network. Way ahead of their time, they
              are working with billion dollar brands building their NFT
              marketplaces, and have scaled their stack to work for smaller
              influencers and entrepreneurs alike to build the use-cases that
              will be ubiquitous in our collective future.
            </p>
          </div>
        </div>
        <div class="flex justify-center items-center flex-wrap">
          <div class="w-full md:w-6/12 lg:w-3/12 lg:mb-0 mb-12 px-4">
            <div class="px-6">
              <img
                alt="..."
                src={kris}
                class="shadow-lg rounded-full mx-auto max-w-120-px"
              />
              <div class="pt-6 text-center">
                <h5 class="text-xl font-bold">Kris Constable</h5>
                <p
                  class="mt-1 text-sm text-blueGray-400 uppercase font-semibold"
                >
                  CEO
                </p>
                <div class="mt-6">
                  <a
                    href="https://twitter.com/cqwww"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button
                      class="bg-lightBlue-400 text-white w-8 h-8 rounded-full outline-none focus:outline-none mr-1 mb-1"
                      type="button"
                    >
                      <i class="fab fa-twitter" />
                    </button></a
                  >
                  <a
                    href="https://github.com/improvethings"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button
                      class="bg-gray-600 text-white w-8 h-8 rounded-full outline-none focus:outline-none mr-1 mb-1"
                      type="button"
                    >
                      <i class="fab fa-github" />
                    </button></a
                  >
                </div>
              </div>
            </div>
          </div>
          <div class="w-full md:w-6/12 lg:w-3/12 lg:mb-0 mb-12 px-4">
            <div class="px-6">
              <img
                alt="..."
                src={adam}
                class="shadow-lg rounded-full mx-auto max-w-120-px"
              />
              <div class="pt-6 text-center">
                <h5 class="text-xl font-bold">Adam Soltys</h5>
                <p
                  class="mt-1 text-sm text-blueGray-400 uppercase font-semibold"
                >
                  CTO
                </p>
                <div class="mt-6">
                  <a
                    href="https://twitter.com/adamsoltys"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button
                      class="bg-lightBlue-400 text-white w-8 h-8 rounded-full outline-none focus:outline-none mr-1 mb-1"
                      type="button"
                    >
                      <i class="fab fa-twitter" />
                    </button></a
                  ><a
                    href="https://github.com/asoltys"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button
                      class="bg-gray-600 text-white w-8 h-8 rounded-full outline-none focus:outline-none mr-1 mb-1"
                      type="button"
                    >
                      <i class="fab fa-github" />
                    </button></a
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="pb-20 relative block bg-blueGray-800">
      <div
        class="bottom-auto top-0 left-0 right-0 w-full absolute pointer-events-none overflow-hidden -mt-20 h-20"
        style="transform: translateZ(0);"
      >
        <svg
          class="absolute bottom-0 overflow-hidden"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          version="1.1"
          viewBox="0 0 2560 100"
          x="0"
          y="0"
        >
          <polygon
            class="text-blueGray-800 fill-current"
            points="2560 0 2560 100 0 100"
          />
        </svg>
      </div>

      <div class="container mx-auto px-4 pt-24 lg:pb-64">
        <div class="flex flex-wrap text-center justify-center">
          <div class="w-full lg:w-6/12 px-4">
            <h2 class="text-4xl font-semibold text-white">
              Let's build something!
            </h2>
            <p class="text-lg leading-relaxed mt-4 mb-4 text-blueGray-400">
              We have built many NFT marketplaces covering a wide variety of
              use-cases and yours could be our next project.
            </p>
          </div>
        </div>
        <div class="flex flex-wrap mt-12 justify-center">
          <div class="w-full lg:w-3/12 px-4 text-center">
            <div
              class="text-blueGray-800 p-3 w-12 h-12 shadow-lg rounded-full bg-brightgreen inline-flex items-center justify-center"
            >
              <i class="fas fa-dollar-sign text-xl" />
            </div>
            <h6 class="text-xl mt-5 font-semibold text-white">
              Low cost transactions
            </h6>
            <p class="mt-2 mb-4 text-blueGray-400">
              No gas fees! Cost for users to mint on your marketplace is only 50
              sats (about 3 cents).
            </p>
          </div>
          <div class="w-full lg:w-3/12 px-4 text-center">
            <div
              class="text-blueGray-800 p-3 w-12 h-12 shadow-lg rounded-full bg-brightgreen inline-flex items-center justify-center"
            >
              <i class="fas fa-coins text-xl" />
            </div>
            <h5 class="text-xl mt-5 font-semibold text-white">
              Any physical or digital asset can be made an NFT
            </h5>
            <p class="mt-2 mb-4 text-blueGray-400">
              The novel invention of digital scarcity means you can tokenize
              anything.
            </p>
          </div>
          <div class="w-full lg:w-3/12 px-4 text-center">
            <div
              class="text-blueGray-800 p-3 w-12 h-12 shadow-lg rounded-full bg-brightgreen inline-flex items-center justify-center"
            >
              <i class="fas fa-hands-helping text-xl" />
            </div>
            <h5 class="text-xl mt-5 font-semibold text-white">
              We're here to help
            </h5>
            <p class="mt-2 mb-20 text-blueGray-400">
              We iterate with you to create the best possible product.
            </p>
          </div>
        </div>
      </div>
    </section>
    <section class="relative block py-24 bg-primary">
      <div class="container mx-auto px-4">
        <div class="flex flex-wrap justify-center lg:-mt-64 -mt-48">
          <div class="w-full lg:w-6/12 px-4">
            <form action="https://formspree.io/f/xwkybjvp" method="POST">
              <div
                class="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-lg bg-blueGray-200"
              >
                <div class="flex-auto p-5 lg:p-10" id="book">
                  <h4 class="text-2xl font-semibold">Book a consultation</h4>
                  <p class="leading-relaxed mt-1 mb-4 text-blueGray-500">
                    We're excited to work with you! Please describe briefly your
                    bitcoin NFT idea or project so we may provide a specific and
                    timely reply to your inquiry.
                  </p>
                  <div class="relative w-full mb-3 mt-8">
                    <label
                      class="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      for="full-name"
                    >
                      Name *
                    </label>
                    <input
                      id="full-name"
                      type="text"
                      required
                      class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Full Name"
                      name="full-name"
                    />
                  </div>

                  <div class="relative w-full mb-3">
                    <label
                      class="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      for="email"
                    >
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Email Address"
                      name="email"
                    />
                  </div>

                  <div class="relative w-full mb-3">
                    <label
                      class="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      for="phone"
                    >
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Phone Number"
                      name="phone"
                    />
                  </div>

                  <div class="relative w-full mb-3">
                    <label
                      class="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      for="company"
                    >
                      Company
                    </label>
                    <input
                      id="company"
                      type="text"
                      class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      placeholder="Company Name"
                      name="company"
                    />
                  </div>

                  <div class="relative w-full mb-3">
                    <label
                      class="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      for="revenue"
                    >
                      Approximate Annual Revenue *
                    </label>
                    <select
                      id="revenue"
                      required
                      class="border-0 px-3 py-3 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                    >
                      <option value="-100000">Under $100,000</option>
                      <option value="100000-500000">$100,000 - $500,000</option>
                      <option value="500000-1000000"
                        >$500,000 - $1,000,000</option
                      >
                      <option value="1m-10m">$1m - $10m</option>
                      <option value="10m+">$10m +</option>
                    </select>
                  </div>

                  <div class="relative w-full mb-3">
                    <label
                      class="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                      for="message"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      rows="4"
                      required
                      cols="80"
                      class="border-0 px-3 py-3 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full"
                      placeholder="Type a message..."
                      name="message"
                    />
                  </div>
                  <div class="text-center mt-6">
                    <button
                      class="bg-secondary text-white active:bg-blueGray-600 text-sm font-bold uppercase px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                      type="button"
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  </main>
  <Footer />
</div>
