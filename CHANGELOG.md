# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.16.0](https://github.com/rive-app/rive-wasm/compare/2.15.6...2.16.0)

### Fixed

- fix for unexpected triggered events [`#7226`](https://github.com/rive-app/rive-wasm/issues/7226)
- use world bounds for coarse grained collision test [`#7286`](https://github.com/rive-app/rive-wasm/issues/7286)
- check before using artboard [`#7261`](https://github.com/rive-app/rive-wasm/issues/7261)

### Commits

- Use unique_ptr in import stack. [`734470c`](https://github.com/rive-app/rive-wasm/commit/734470cd5b1c0287435323828d4fc039117b1183)
- Xxxx expose rive file to js api [`005e68f`](https://github.com/rive-app/rive-wasm/commit/005e68f2ecea8bf59305dd5f59a260691b2ed68e)
- Fail early with bad blend modes. [`06db3db`](https://github.com/rive-app/rive-wasm/commit/06db3db4810cc809ac917598e20ce8558ae2e53a)
- Fix warnings about invalid toolsets [`6037650`](https://github.com/rive-app/rive-wasm/commit/60376507389f5eedf449079e1ccaf299436a76e3)
- validating core objects property keys on load [`87069a5`](https://github.com/rive-app/rive-wasm/commit/87069a5ba33a5143ea433479751c03646e9dde8d)
- Make ContourMeasure more robust [`911ea4c`](https://github.com/rive-app/rive-wasm/commit/911ea4ce235455a0c7298ad63372809725b9358d)
- initialize seed with chrono [`7fd2ab0`](https://github.com/rive-app/rive-wasm/commit/7fd2ab094489a5dbace26500391d859c0a1073b7)
- Simple libjpeg [`e3e7266`](https://github.com/rive-app/rive-wasm/commit/e3e7266123584a8078edbc6affc4bfe1fb6b4c99)
- 7261 crash on state machine names [`488eefb`](https://github.com/rive-app/rive-wasm/commit/488eefb007dba22b2081fe910c3326d6e9ad6e03)

## [2.15.6](https://github.com/rive-app/rive-wasm/compare/2.15.5...2.15.6) - 2024-05-10

### Commits

- chore: tag 2.15.6 [`ca24465`](https://github.com/rive-app/rive-wasm/commit/ca24465d03c4c66ad8f0bf6ab5ba43a5f28a2d82)
- fix advancing nested animations [`34289df`](https://github.com/rive-app/rive-wasm/commit/34289dfe7fa6bdecef713ea9fe3fb66fe4c7fe76)

## [2.15.5](https://github.com/rive-app/rive-wasm/compare/2.15.4...2.15.5) - 2024-05-09

### Fixed

- Fix an assert in contour_measure.cpp [`#7210`](https://github.com/rive-app/rive-wasm/issues/7210)

### Commits

- chore: tag 2.15.5 [`85a1e05`](https://github.com/rive-app/rive-wasm/commit/85a1e05356c13a54c22d0c8b967ea1275b4a4c14)
- remove harfbuzz flag [`b462cef`](https://github.com/rive-app/rive-wasm/commit/b462cefaafa900d6719323568799eddc87c912d3)
- Don't defer path update if Shape has a dependent skin [`7a70b1f`](https://github.com/rive-app/rive-wasm/commit/7a70b1fc54d1dac156ae43001a15d27d43a18df0)
- Add strokes, gradients, and blend modes to path_fuzz [`dfcb2e3`](https://github.com/rive-app/rive-wasm/commit/dfcb2e3d766f69c2c40289d6a5af06690db5cbd3)

## [2.15.4](https://github.com/rive-app/rive-wasm/compare/2.15.3...2.15.4) - 2024-05-08

### Commits

- chore: tag 2.15.4 [`70e26b2`](https://github.com/rive-app/rive-wasm/commit/70e26b2a5a3b763288320f9b448ee5250ab83d1f)
- Wasm fallback and min safari version [`4e47118`](https://github.com/rive-app/rive-wasm/commit/4e471182c73f3db5c10726ac4d4b46cdd75b9d1d)

## [2.15.3](https://github.com/rive-app/rive-wasm/compare/2.15.2...2.15.3) - 2024-05-08

### Commits

- chore: tag 2.15.3 [`bab22e6`](https://github.com/rive-app/rive-wasm/commit/bab22e63dc955508bfdc3a33b116075a7f3bd736)
- Add a "path_fuzz" mode to the PLS fuzzer [`8d2a799`](https://github.com/rive-app/rive-wasm/commit/8d2a7997610c92aa5c030527cb55e61468cff80c)
- Fix ios analyzer [`104f088`](https://github.com/rive-app/rive-wasm/commit/104f088d8800d9d16dedfdf4071711f544ea763c)
- Add static/dynamic runtime config based on actual target config. [`dd97a36`](https://github.com/rive-app/rive-wasm/commit/dd97a36c091faa2ca0b5f7064509b96304900870)
- fix state machine advanceAndApply [`d747731`](https://github.com/rive-app/rive-wasm/commit/d74773114d2e078d810b9ab7aad21cb2ed0bfa3c)
- Xxxx support target align from position [`3f2bab1`](https://github.com/rive-app/rive-wasm/commit/3f2bab14b7ce33077c8313356bf83d0b0434b19c)
- Handle NaN in PLS paths and transforms [`3bd7b0b`](https://github.com/rive-app/rive-wasm/commit/3bd7b0ba18fa3b27607946ae447d78bf64899e82)

## [2.15.2](https://github.com/rive-app/rive-wasm/compare/2.15.1...2.15.2) - 2024-04-30

### Commits

- chore: tag 2.15.2 [`e47beb4`](https://github.com/rive-app/rive-wasm/commit/e47beb4cb8e3aa80d980fe320f1729e08f8be7e4)
- add observer polyfill [`67e826a`](https://github.com/rive-app/rive-wasm/commit/67e826adec0dbf6df33890bd06739c9f1200d9ce)

## [2.15.1](https://github.com/rive-app/rive-wasm/compare/2.15.0...2.15.1) - 2024-04-30

### Fixed

- fix follow path not working with path as target and shape with 0 opacity [`#7155`](https://github.com/rive-app/rive-wasm/issues/7155)

### Commits

- chore: tag 2.15.1 [`7a30128`](https://github.com/rive-app/rive-wasm/commit/7a301282472a3a14679db3e2dfa5909d4a659555)
- GameKit on Windows [`dcf28ad`](https://github.com/rive-app/rive-wasm/commit/dcf28addd6e04a5702004615260a8a5a30659799)
- add resize observer for rive instances [`1904dfa`](https://github.com/rive-app/rive-wasm/commit/1904dfabe3d4845388b0609b33643dd73e743b3e)
- initialize audio manager only if an instance needs it [`759dc45`](https://github.com/rive-app/rive-wasm/commit/759dc4542dc926c7cd9772f309e081f9ba3d59a0)

## [2.15.0](https://github.com/rive-app/rive-wasm/compare/2.14.4...2.15.0) - 2024-04-24

### Commits

- chore: tag 2.15.0 [`f69b6d3`](https://github.com/rive-app/rive-wasm/commit/f69b6d3ecd70d498430401accd0e0143afa96343)
- fix version numbers [`97ff287`](https://github.com/rive-app/rive-wasm/commit/97ff287bbc1c3eb078793a9981d8c80d9ea6b659)
- Pushing merge, resolved using upstream.\n\n message=feat: add wasm audio out of band [`d169023`](https://github.com/rive-app/rive-wasm/commit/d169023ea28785ccba683836ab7fc8b90112ed8a)

## [2.14.4](https://github.com/rive-app/rive-wasm/compare/2.14.3...2.14.4) - 2024-04-23

### Commits

- chore: tag 2.14.4 [`c0faf89`](https://github.com/rive-app/rive-wasm/commit/c0faf890c187562aaa04f27cbd702777923f504d)
- Fix audio instances [`79aa41d`](https://github.com/rive-app/rive-wasm/commit/79aa41df6bbf32a07fc47467f8369137f593c8dc)
- add out of band audio support ios - abstracted audio! [`924b938`](https://github.com/rive-app/rive-wasm/commit/924b938d8a8e941ca5a4ac08d1dbff055d64dd78)
- Xxxx randomization updates part 2 [`433965d`](https://github.com/rive-app/rive-wasm/commit/433965d0dedf0d1d055c43b5bc98e136f5378f36)
- Xxxx support random transitions [`66a1d4d`](https://github.com/rive-app/rive-wasm/commit/66a1d4de84e99f845acd4b93055a2890b474f6ce)
- support randomizing transitions [`0868fb3`](https://github.com/rive-app/rive-wasm/commit/0868fb3ed787b45860c21fac73c6dbb4d59225ee)

## [2.14.3](https://github.com/rive-app/rive-wasm/compare/2.14.2...2.14.3) - 2024-04-18

### Commits

- chore: tag 2.14.3 [`4c1d046`](https://github.com/rive-app/rive-wasm/commit/4c1d0468fb478720d5b5310db13dc66734590891)
- propagate volume to nested artboards [`9268272`](https://github.com/rive-app/rive-wasm/commit/926827232dfbad8aff639ae4575963860c60be50)

## [2.14.2](https://github.com/rive-app/rive-wasm/compare/2.14.1...2.14.2) - 2024-04-17

### Commits

- chore: tag 2.14.2 [`afb1465`](https://github.com/rive-app/rive-wasm/commit/afb1465d761c6b7c11210cba46eb91ea2c38f808)
- update listener to use pointerdown [`91a1b90`](https://github.com/rive-app/rive-wasm/commit/91a1b9087b13db84721e6d0201c4a3b494246348)
- update audio manager to also listen to user interaction [`bf18c67`](https://github.com/rive-app/rive-wasm/commit/bf18c6728a91acd5e88659c595091994897b5ff4)
- Stop audio in iOS when backgrounded. [`9345879`](https://github.com/rive-app/rive-wasm/commit/9345879d0b9bc9870eee09336d0b1a6bae8b90aa)
- add audio manager to handle audio context in browser [`9aa89a0`](https://github.com/rive-app/rive-wasm/commit/9aa89a0a39fa2a1efc88382956dc0dfc356da1a6)

## [2.14.1](https://github.com/rive-app/rive-wasm/compare/2.14.0...2.14.1) - 2024-04-11

### Commits

- chore: tag 2.14.1 [`d352873`](https://github.com/rive-app/rive-wasm/commit/d35287366eac2be8236eb1c5d3f0b5c3798d099e)
- add definition [`0c10fc3`](https://github.com/rive-app/rive-wasm/commit/0c10fc3a48eb40b83bc71af61a15d2298027a22e)
- Exposing artboard volume [`aa84e1a`](https://github.com/rive-app/rive-wasm/commit/aa84e1a83e23be184e1f0fb4b1ff600b98f51cd2)

## [2.14.0](https://github.com/rive-app/rive-wasm/compare/2.13.2...2.14.0) - 2024-04-10

### Commits

- chore: tag 2.14.0 [`4110fd5`](https://github.com/rive-app/rive-wasm/commit/4110fd5a8e0ece9fc0562f19cbc073ccb01f8c37)
- Fixing audio runtimes. [`2f8daa8`](https://github.com/rive-app/rive-wasm/commit/2f8daa8283d6e0c805d7643506817126c66ba33c)

## [2.13.2](https://github.com/rive-app/rive-wasm/compare/2.13.0...2.13.2) - 2024-04-09

### Merged

- update version manually to 2.13.1 [`#353`](https://github.com/rive-app/rive-wasm/pull/353)

### Commits

- chore: tag 2.13.2 [`f6be9f7`](https://github.com/rive-app/rive-wasm/commit/f6be9f750e87c6f20b12ef2041d87096b2b6cff7)
- Fix WASM audio MP3 [`0db549c`](https://github.com/rive-app/rive-wasm/commit/0db549c5503fbf17b956b7c71bd57b87a7fdeea2)
- chore: tag 2.12.2 [`ade65fc`](https://github.com/rive-app/rive-wasm/commit/ade65fc2d7c472fcaa373d0cf0f4988bc1090e0d)
- negative speed fix [`789cbe7`](https://github.com/rive-app/rive-wasm/commit/789cbe759b94ff929ca36e184d7a32089bb048a9)
- feat: add APIs to configure Rive Listener setup for allowing touch scroll behavior on the canvas [`7488d1c`](https://github.com/rive-app/rive-wasm/commit/7488d1c92a7c6ae66657486d3baef98f215ae2fe)

## [2.13.0](https://github.com/rive-app/rive-wasm/compare/2.12.2...2.13.0) - 2024-04-08

### Commits

- chore: tag 2.13.0 [`96b873b`](https://github.com/rive-app/rive-wasm/commit/96b873b521815124a348cb1da153b4837972c80f)

## [2.12.2](https://github.com/rive-app/rive-wasm/compare/2.12.1...2.12.2) - 2024-04-08

### Fixed

- treat cubic curve as quad when control point equals endpoint [`#6969`](https://github.com/rive-app/rive-wasm/issues/6969)

### Commits

- chore: tag 2.12.2 [`ade65fc`](https://github.com/rive-app/rive-wasm/commit/ade65fc2d7c472fcaa373d0cf0f4988bc1090e0d)
- negative speed fix [`789cbe7`](https://github.com/rive-app/rive-wasm/commit/789cbe759b94ff929ca36e184d7a32089bb048a9)
- feat: add APIs to configure Rive Listener setup for allowing touch scroll behavior on the canvas [`7488d1c`](https://github.com/rive-app/rive-wasm/commit/7488d1c92a7c6ae66657486d3baef98f215ae2fe)
- Audio asset volume + VU [`e1011f4`](https://github.com/rive-app/rive-wasm/commit/e1011f45382156e022257e98353aba41bc78db22)

## [2.12.1](https://github.com/rive-app/rive-wasm/compare/2.12.0...2.12.1) - 2024-03-29

### Commits

- chore: tag 2.12.1 [`baeb09c`](https://github.com/rive-app/rive-wasm/commit/baeb09cdb42b7d2da651b45faa5c9bdbe1c9174e)
- Export proxy and testing at runtime. [`22eea55`](https://github.com/rive-app/rive-wasm/commit/22eea554abc0771eb8da9eb93c44b581094fe2ab)
- Export audio clip [`41ba537`](https://github.com/rive-app/rive-wasm/commit/41ba5377427a8656a2eacfbfa8f226e05f4a397f)
- propagate parent input change to nested input [`72096d2`](https://github.com/rive-app/rive-wasm/commit/72096d270f16ee59096f9233d582a232a2f55425)

## [2.12.0](https://github.com/rive-app/rive-wasm/compare/2.11.0...2.12.0) - 2024-03-27

### Commits

- chore: tag 2.12.0 [`0e2ef60`](https://github.com/rive-app/rive-wasm/commit/0e2ef60038c542ee88a2eef48644ae3684909436)
- install ply on downstream wasm CI [`def3f13`](https://github.com/rive-app/rive-wasm/commit/def3f13d66a4091cba8d41f45f36f6bbef0c39c7)
- Get wasm sizes back down. [`e5977a6`](https://github.com/rive-app/rive-wasm/commit/e5977a6287ede942d77c355e98ccdfdd38c98bd0)
- No simd canvas [`2a9cd21`](https://github.com/rive-app/rive-wasm/commit/2a9cd2156d019d84dedf0d1db08a6746e08d431f)
- More LTO tweaks [`48a16a6`](https://github.com/rive-app/rive-wasm/commit/48a16a611ff6746588531f838a41acc006b40195)
- rename to rive-renderer and add readme [`bd349b5`](https://github.com/rive-app/rive-wasm/commit/bd349b51096de16349a7e483a7e69d43a5a9664f)
- fix: remove premake flag [`27ed464`](https://github.com/rive-app/rive-wasm/commit/27ed4643728b72b95a10df163134c583fbc2d1b6)

## [2.11.0](https://github.com/rive-app/rive-wasm/compare/2.10.4...2.11.0) - 2024-03-19

### Commits

- chore: tag 2.11.0 [`f256e80`](https://github.com/rive-app/rive-wasm/commit/f256e80a23a1e753237668d715e8e20889824276)
- Fix checkout of rive-pls in rive-wasm [`5fba0aa`](https://github.com/rive-app/rive-wasm/commit/5fba0aa8d6231eaf88085a9e703730fa26d11292)
- Add a @rive-app/webgl2 package that uses PLS [`98b3cd4`](https://github.com/rive-app/rive-wasm/commit/98b3cd437f851cbd518c6a1816cd7c573abf32dd)
- remove stale examples from rive-wasm [`172f212`](https://github.com/rive-app/rive-wasm/commit/172f212ef008746196c2785795947d24acc7e1ca)
- Fix flush() to balance clear() in parcel_example [`58b88f0`](https://github.com/rive-app/rive-wasm/commit/58b88f05edaee0985c974c24a4041b29979b925c)
- Move cleaning up renderer into its own API outside of cleanup [`9318ac6`](https://github.com/rive-app/rive-wasm/commit/9318ac6f8cdf194485fd90da5fa3326f3e8fe5a1)
- Remove the Queue from Metal PLS [`3dfe454`](https://github.com/rive-app/rive-wasm/commit/3dfe4545bd4561d10ffbb35ba34d523bad160ff2)
- support for interrupting transitions on state change [`e825a13`](https://github.com/rive-app/rive-wasm/commit/e825a135ed2b5ed5c99218d52ed2fec2bf92e532)
- Update README.md [`0ec0835`](https://github.com/rive-app/rive-wasm/commit/0ec0835960d31cdf0f7a281e20ddbf5b84e9c341)
- chore: update README [`54a4bd9`](https://github.com/rive-app/rive-wasm/commit/54a4bd92f3050b745317a5f4c5fa7338dd190ea0)

## [2.10.4](https://github.com/rive-app/rive-wasm/compare/2.10.3...2.10.4) - 2024-03-11

### Commits

- chore: tag 2.10.4 [`f6e2211`](https://github.com/rive-app/rive-wasm/commit/f6e22110d5db34fd7cac5c859a25fff79e625b37)
- Unity webgl! [`e3c0033`](https://github.com/rive-app/rive-wasm/commit/e3c00339d7787df030764643a26128407c99c40a)
- Always decode 3 or 4 channel PNG images. [`f23e5f3`](https://github.com/rive-app/rive-wasm/commit/f23e5f367de5242489cd8e16cdd5fced48ac8dc8)
- Upgrade rive_wasm to the new premake system [`4c4b5b4`](https://github.com/rive-app/rive-wasm/commit/4c4b5b430ea707c37c57add4dc0c55968d577141)
- Generate WASM sizes only when necesary [`a20794b`](https://github.com/rive-app/rive-wasm/commit/a20794b8d032ddeae1dc947ca0e90bc7a1d14bdb)
- slim down harfbuzz [`55ddabd`](https://github.com/rive-app/rive-wasm/commit/55ddabddd5fd053b3010711fd790cebf4b77f490)
- Implement an MSAA fallback for PLS [`2e787a1`](https://github.com/rive-app/rive-wasm/commit/2e787a191ad5c662acc5156e1923a050b9de88e2)

## [2.10.3](https://github.com/rive-app/rive-wasm/compare/2.10.2...2.10.3) - 2024-02-26

### Commits

- chore: tag 2.10.3 [`f58c17a`](https://github.com/rive-app/rive-wasm/commit/f58c17aa0c6bed2da79c2fb5c776727b8d5d88bf)
- trigger change when text modifier updates [`e5c0750`](https://github.com/rive-app/rive-wasm/commit/e5c0750c3a9e29f5c0b8f2e8e9bdbfef9fe8855b)
- add support for text feature in runtime [`62f995d`](https://github.com/rive-app/rive-wasm/commit/62f995df33593ef8f5aee8bff1137ad2cbe6c544)

## [2.10.2](https://github.com/rive-app/rive-wasm/compare/2.10.1...2.10.2) - 2024-02-21

### Commits

- chore: tag 2.10.2 [`e8c4dfd`](https://github.com/rive-app/rive-wasm/commit/e8c4dfdd74e51b5d14aeb1b51c1298ce57dedb4f)
- sort hit shapes when draw order changes and stop propagation on hit s… [`c377c99`](https://github.com/rive-app/rive-wasm/commit/c377c992a653b16cece635ecd37001abe4a06fd0)
- Updating harfbuzz to 8.3.0 [`8165f23`](https://github.com/rive-app/rive-wasm/commit/8165f2351b59e36f3b047f1477faf8d1ba7ee7ea)
- Unity compute bounds [`4c7ed1e`](https://github.com/rive-app/rive-wasm/commit/4c7ed1e4c085a6887fafb378c0f2adbdd193dfe7)
- Fix path for downstream runtime. [`21105bd`](https://github.com/rive-app/rive-wasm/commit/21105bd0eb58ec313dfc9490d2f70050056428a5)
- Fix downstream cpp tests [`4a39e95`](https://github.com/rive-app/rive-wasm/commit/4a39e954362de1a0151e06ca7dda7f99e1dd2c56)
- Single test script for windows and mac. [`d5a58bb`](https://github.com/rive-app/rive-wasm/commit/d5a58bbd4d17323cc26d5204f460e6079bd12e31)
- Fix tests to use harfbuzz renames. [`7a63a40`](https://github.com/rive-app/rive-wasm/commit/7a63a40f70574f4d6ece7b41d3c3623c5a91a4a1)
- make a change to force a mono flush [`f7a048f`](https://github.com/rive-app/rive-wasm/commit/f7a048f9cc23f791a8f6e1cb905de699769157dc)
- Audio out of band in Unity! [`65f2cef`](https://github.com/rive-app/rive-wasm/commit/65f2cefdab79411dfcaf1396b1cb7efa9a7f1fdd)
- Audio for Unity [`ec73b95`](https://github.com/rive-app/rive-wasm/commit/ec73b951390b3e37780e75479337b33348bfd18d)
- fix cast [`e1e4d96`](https://github.com/rive-app/rive-wasm/commit/e1e4d96cb894d49dfc79d262f79d4253c8efbbce)
- Add audio preview generator. [`a322457`](https://github.com/rive-app/rive-wasm/commit/a322457676fe2e6a8f81afce555821cd5b78ffb3)

## [2.10.1](https://github.com/rive-app/rive-wasm/compare/2.10.0...2.10.1) - 2024-02-08

### Commits

- chore: tag 2.10.1 [`52fca8d`](https://github.com/rive-app/rive-wasm/commit/52fca8dee50f4ea2b9fddc408b0e797611639c72)
- text modifier length calculation fix [`4228eb0`](https://github.com/rive-app/rive-wasm/commit/4228eb0e49f37a5f580da455f3f6aea216a6d294)

## [2.10.0](https://github.com/rive-app/rive-wasm/compare/2.9.3...2.10.0) - 2024-02-05

### Commits

- chore: tag 2.10.0 [`d386ef6`](https://github.com/rive-app/rive-wasm/commit/d386ef6965bf6884989deda1678fad43db8591b9)
- Rework text/event count/at. [`94dab1f`](https://github.com/rive-app/rive-wasm/commit/94dab1f09d4bfaf86504166f9cf7a74d48aa92db)
- fix ./build_viewer.sh run [`7a2fc03`](https://github.com/rive-app/rive-wasm/commit/7a2fc03885bdd5b2bebf01a36709cda96af82457)
- Update goldens [`02dadf3`](https://github.com/rive-app/rive-wasm/commit/02dadf360f291fc4379f31412dc56edeebfa6449)
- apply current state update before changing states [`ea2a2f4`](https://github.com/rive-app/rive-wasm/commit/ea2a2f4c11ad655a8e77341bc3c142a5876b8be4)
- Clean up emscripten build [`a69f708`](https://github.com/rive-app/rive-wasm/commit/a69f7085e8f73c4d8f8a5ac95552f61006117b1c)
- make sure we force embedded assets when exporting for cloud renderer … [`9915108`](https://github.com/rive-app/rive-wasm/commit/99151082319ee4eba5523b3203426a9b920b4903)
- Fix GL rendering with URP. [`3778cd3`](https://github.com/rive-app/rive-wasm/commit/3778cd3bbdc77deb7dac046d47a74e350c14e044)
- Unity with new Premake scripts! [`776f931`](https://github.com/rive-app/rive-wasm/commit/776f93136406835fa63026f9dc3cb6060f11aa3c)
- Unity Android & C# style updates [`3bca997`](https://github.com/rive-app/rive-wasm/commit/3bca9970d49c0ad58dbb003bd1ded5af5978363d)
- fix listener resolving to different event [`e08a6c4`](https://github.com/rive-app/rive-wasm/commit/e08a6c4556b64a1dc132707ca3da5e8625537beb)
- Tests use new premake system [`7c57d54`](https://github.com/rive-app/rive-wasm/commit/7c57d54bf32abc0d4e79d9cb51bdb17ce2865cbc)
- fix viewer build [`77695f6`](https://github.com/rive-app/rive-wasm/commit/77695f6ed7ad8cbf9053585ffb17439c3c3c3b0f)
- Lua formatter [`d5ffcb9`](https://github.com/rive-app/rive-wasm/commit/d5ffcb9e41fea196498b53a2b53c6ad7a3c8e050)
- Reorganize premake [`dc9c662`](https://github.com/rive-app/rive-wasm/commit/dc9c662f45e3d24dbd33d0c51c797f1a1f94509c)
- Build Android deps with audio [`cbc5cee`](https://github.com/rive-app/rive-wasm/commit/cbc5cee3c41efc34b2be563fb71b21fd5522ac9e)
- PLS external framebuffer optimizations [`bf25bfa`](https://github.com/rive-app/rive-wasm/commit/bf25bfae22c7a55c7b91bba47a98e071fcac910d)
- Properly generate an android_ndk toolset [`c472135`](https://github.com/rive-app/rive-wasm/commit/c4721359fb3462c98cfa0d9620848ac8753a1585)
- Audio engine [`2a644b8`](https://github.com/rive-app/rive-wasm/commit/2a644b848d4aee8c18f15146a22391bab7a5650e)
- poc for adding "flush" [`3b48f12`](https://github.com/rive-app/rive-wasm/commit/3b48f12e93f95d10dc47f72085ec488d2ac48a62)
- IntersectionBoard optimizations [`0332745`](https://github.com/rive-app/rive-wasm/commit/0332745fc153a44ea606d7d562f5cf967c410f61)
- IntersectionBoard cleanups [`13dfbd0`](https://github.com/rive-app/rive-wasm/commit/13dfbd043aeb8198d7fd04d11d2d418960a74d90)

## [2.9.3](https://github.com/rive-app/rive-wasm/compare/2.9.2...2.9.3) - 2024-01-18

### Fixed

- fix elastic interpolator crash with period 0 [`#6422`](https://github.com/rive-app/rive-wasm/issues/6422)

### Commits

- chore: tag 2.9.3 [`5de8515`](https://github.com/rive-app/rive-wasm/commit/5de8515751a6999b1ed967ac80c520a2f378b32b)
- Unify storage buffers for atomic mode and normal [`07055fe`](https://github.com/rive-app/rive-wasm/commit/07055fe644a0b7bf819e332c152022082133b3eb)
- default to skia branch for commit hash in cache helper [`88846e5`](https://github.com/rive-app/rive-wasm/commit/88846e541e46576c3e5a10c45668df3e6ef14543)
- Implement re-ordering for PLS atomic draws [`391108d`](https://github.com/rive-app/rive-wasm/commit/391108d4d084741968abc66a651cf65ce5df40d5)

## [2.9.2](https://github.com/rive-app/rive-wasm/compare/2.9.1...2.9.2) - 2024-01-08

### Commits

- chore: tag 2.9.2 [`7d028e9`](https://github.com/rive-app/rive-wasm/commit/7d028e969e2aed543381ed15aed65fa2b44c1054)
- add optional param for method resizeDrawingSurfaceToCanvas [`f251f5e`](https://github.com/rive-app/rive-wasm/commit/f251f5e97b223f8f5fd453ce87dd97ed86223fc6)
- add support for self clipping shape [`b3f9097`](https://github.com/rive-app/rive-wasm/commit/b3f9097dbf77621dbf618ace61a0a78733b45b95)
- clone metrics path when a path is added [`40a2201`](https://github.com/rive-app/rive-wasm/commit/40a2201d662b8209e55d45759d5b42886e0bf87b)
- Defer PLS writes to GPU resources until flush [`a6c451d`](https://github.com/rive-app/rive-wasm/commit/a6c451dbf29b3b2858e0c95c110826d2366f7d89)

## [2.9.1](https://github.com/rive-app/rive-wasm/compare/2.9.0...2.9.1) - 2024-01-03

### Commits

- chore: tag 2.9.1 [`73780e2`](https://github.com/rive-app/rive-wasm/commit/73780e29976d05c17ca3bda64f21c61bfeaaa543)
- Fix: Include types declaration in webgl advanced packages [`d356ab5`](https://github.com/rive-app/rive-wasm/commit/d356ab5e7026ef0f2528ea3c090c75232dc9e318)
- Refactor PLSRenderer into draw objects [`cd59415`](https://github.com/rive-app/rive-wasm/commit/cd5941536333f9cec21978d20948e149d442a2f1)
- Convert RenderPath/CommandPath and RenderPaint to refcounted objects [`1dffe23`](https://github.com/rive-app/rive-wasm/commit/1dffe231bb54317804c4895419d352e492fc4e10)
- Delete the Vec2D default constructor [`efc3bd5`](https://github.com/rive-app/rive-wasm/commit/efc3bd5bfbdff9dadbf8b5759a64136e36847441)

## [2.9.0](https://github.com/rive-app/rive-wasm/compare/2.8.3...2.9.0) - 2023-12-21

### Commits

- chore: tag 2.9.0 [`11ed0c3`](https://github.com/rive-app/rive-wasm/commit/11ed0c3d6385ef1294019dda2d1c097f6378f860)
- use skia directly from skia repository for recorder [`c7b8ff3`](https://github.com/rive-app/rive-wasm/commit/c7b8ff3bc1b59dd2e16986f7a9971c55dcfc976b)
- feat: only use webgl instead of webgl2 in iOS browsers to try and prevent crashing on iOS Safari [`35df9e0`](https://github.com/rive-app/rive-wasm/commit/35df9e0d5ca064ecaf7dd5e696ca90e40e91038e)
- add support for svg export [`63bb2f6`](https://github.com/rive-app/rive-wasm/commit/63bb2f66542b5ab75aa3a6cc7889edea94856dab)
- fix off color interpolation [`e2da9c7`](https://github.com/rive-app/rive-wasm/commit/e2da9c781ef25f603d46efe6971c1e8d9e03fd19)

## [2.8.3](https://github.com/rive-app/rive-wasm/compare/2.8.2...2.8.3) - 2023-12-15

### Commits

- chore: tag 2.8.3 [`b6e3d60`](https://github.com/rive-app/rive-wasm/commit/b6e3d60d65e219cf719c9921752234dc4a250676)
- fix: add back in the image texture delete action [`af46a7b`](https://github.com/rive-app/rive-wasm/commit/af46a7be364beed1c177932f9764e3cba4b4229b)

## [2.8.2](https://github.com/rive-app/rive-wasm/compare/2.8.1...2.8.2) - 2023-12-15

### Commits

- chore: tag 2.8.2 [`02e4a80`](https://github.com/rive-app/rive-wasm/commit/02e4a8052b213d39ed10e3e5ab2557cc1b507259)
- remove optional chaining added in renderer.js [`bb3ba22`](https://github.com/rive-app/rive-wasm/commit/bb3ba220610c3091e41ae334c12ebe160816c373)

## [2.8.1](https://github.com/rive-app/rive-wasm/compare/2.8.0...2.8.1) - 2023-12-15

### Commits

- chore: tag 2.8.1 [`dc898a0`](https://github.com/rive-app/rive-wasm/commit/dc898a02f23a871cea6d0b6013ba46442274165a)
- Adding more proxy checks on rendering mesh and stop drawing images if we cant render it [`4acd184`](https://github.com/rive-app/rive-wasm/commit/4acd184e7e2cd587b93206f8e494cf60f0a5ce60)

## [2.8.0](https://github.com/rive-app/rive-wasm/compare/2.7.9...2.8.0) - 2023-12-15

### Commits

- chore: tag 2.8.0 [`96f4c2a`](https://github.com/rive-app/rive-wasm/commit/96f4c2ad4e2414644c89b5b070d02b291a72d7c1)
- fix: revert image texture destructor for testing binding issues [`8c7b72c`](https://github.com/rive-app/rive-wasm/commit/8c7b72cf9fcbe60d8ec7502b526cd50ebcb888a6)

## [2.7.9](https://github.com/rive-app/rive-wasm/compare/2.7.8...2.7.9) - 2023-12-15

### Commits

- chore: tag 2.7.9 [`efb2e47`](https://github.com/rive-app/rive-wasm/commit/efb2e4757b216dcc661695956d8e805c7e409471)
- fix: try wrapping the webgl context as a proxy and erroring out early if context is lost [`df1977e`](https://github.com/rive-app/rive-wasm/commit/df1977eae6d279d49b4ffc9fc37ab817e37ff420)

## [2.7.8](https://github.com/rive-app/rive-wasm/compare/2.7.7...2.7.8) - 2023-12-14

### Commits

- chore: tag 2.7.8 [`97563b3`](https://github.com/rive-app/rive-wasm/commit/97563b3c6e460a3cfd0da497a071864155449047)
- chore: fix broken docs link [`85ff798`](https://github.com/rive-app/rive-wasm/commit/85ff79809ec019e27574ee9761c4df3953543b81)

## [2.7.7](https://github.com/rive-app/rive-wasm/compare/2.7.6...2.7.7) - 2023-12-11

### Commits

- chore: tag 2.7.7 [`70a9564`](https://github.com/rive-app/rive-wasm/commit/70a956474d8992ce8dc989b367a3ee8183349996)
- Add a "lite_rtti" utility and use it with Render objects [`a94902e`](https://github.com/rive-app/rive-wasm/commit/a94902ef0b45a50fd372cc3aaee13bc3fae323be)
- fix: exaggerate pointer exit listener on mouseout to account for hitareas too close to the artboard border [`b831f39`](https://github.com/rive-app/rive-wasm/commit/b831f394fbc77c556bf3d8e475971c53d27ba759)
- Make tess compile again [`64c935e`](https://github.com/rive-app/rive-wasm/commit/64c935e2bfb9f36c8ee9c4745b9f0da7888c8043)
- Ios out of band [`b3fa7de`](https://github.com/rive-app/rive-wasm/commit/b3fa7de777c84ba15bbbaa9f7637e87e60bbf015)

## [2.7.6](https://github.com/rive-app/rive-wasm/compare/2.7.5...2.7.6) - 2023-11-30

### Commits

- chore: tag 2.7.6 [`7c93bc0`](https://github.com/rive-app/rive-wasm/commit/7c93bc0f05e1b6477bce25a46da3986c67218fa5)
- skip constraints in editor when target is collapsed [`1468503`](https://github.com/rive-app/rive-wasm/commit/1468503d5832c6f06d0bf7806df68b3455eab969)

## [2.7.5](https://github.com/rive-app/rive-wasm/compare/2.7.4...2.7.5) - 2023-11-29

### Commits

- chore: tag 2.7.5 [`ced1772`](https://github.com/rive-app/rive-wasm/commit/ced1772ff494d268880161830a10dbe78ca8c153)
- ignore paths that are inactive in solos when calculating hit test [`d1ad646`](https://github.com/rive-app/rive-wasm/commit/d1ad64672bafd5e75d512b9cdf5159cf1cd519bf)
- generate drawing rules in the correct order [`fc49a2d`](https://github.com/rive-app/rive-wasm/commit/fc49a2dfcc2f561891738c515104872d52cf7138)
- Xxxx hidden paths runtime render fixes solos [`da6146d`](https://github.com/rive-app/rive-wasm/commit/da6146d2b8ae2ccc783d59f109b576ff0dabb2e5)

## [2.7.4](https://github.com/rive-app/rive-wasm/compare/2.7.3...2.7.4) - 2023-11-21

### Commits

- chore: tag 2.7.4 [`0cdde88`](https://github.com/rive-app/rive-wasm/commit/0cdde883a01dbefffb9380df1d0c30acfe0a05b7)
- tendon crash fix [`529e597`](https://github.com/rive-app/rive-wasm/commit/529e5972a90998f7293bcdc587a8aff70500c036)
- patch: Only clean up the Renderer object if it is a CanvasRenderer, as WebGL Renderer does not need to be deleted [`2df6145`](https://github.com/rive-app/rive-wasm/commit/2df61459386cd9f43ed35661dda325656402662b)
- Disable d3d blend state during PLS flush [`33e5609`](https://github.com/rive-app/rive-wasm/commit/33e560953fe3ae4ede9b079ba653afd9bb76e53a)
- add clipResult enum and render clips to copy the editor behavior [`b8c029c`](https://github.com/rive-app/rive-wasm/commit/b8c029cf36d008b604400db7e6999e09de7ba194)
- Unity [`da338c3`](https://github.com/rive-app/rive-wasm/commit/da338c3e65815e0a690d14dbc46f06e65fdadd9f)

## [2.7.3](https://github.com/rive-app/rive-wasm/compare/2.7.2...2.7.3) - 2023-11-09

### Commits

- chore: tag 2.7.3 [`f6e5255`](https://github.com/rive-app/rive-wasm/commit/f6e525559f27b1bda296ce85313f2da6b05f6ff4)
- Delete assets after artboards to fix race condition with FileAssetReferencers. [`f7e6924`](https://github.com/rive-app/rive-wasm/commit/f7e69246a4c9c64f747ff0da979a7f28cb336dc7)

## [2.7.2](https://github.com/rive-app/rive-wasm/compare/2.7.1...2.7.2) - 2023-11-08

### Commits

- chore: tag 2.7.2 [`9fd1e94`](https://github.com/rive-app/rive-wasm/commit/9fd1e94106ddb827670e0f323d7dfd23c11d74c4)
- Fix validation for listeners to validate with nested inputs [`3062170`](https://github.com/rive-app/rive-wasm/commit/306217049c3303aeeb5fd0e367f0b7922db5a200)

## [2.7.1](https://github.com/rive-app/rive-wasm/compare/2.7.0...2.7.1) - 2023-11-07

### Fixed

- Fix follow path 6070 [`#6070`](https://github.com/rive-app/rive-wasm/issues/6070)

### Commits

- chore: tag 2.7.1 [`1319fa9`](https://github.com/rive-app/rive-wasm/commit/1319fa9de57dfffb5cdae2f6977cb28ef26d9d24)
- Add types for ImageAsset and FontAsset [`9e54b20`](https://github.com/rive-app/rive-wasm/commit/9e54b205091d8da141046fe485d1407a63a0b218)
- compute parameters when cubic values change [`bddcd7b`](https://github.com/rive-app/rive-wasm/commit/bddcd7bbd39db5ae3471bc0b68e7c502214539cd)
- fix: Made default and copy constructors explicit. [`37aef15`](https://github.com/rive-app/rive-wasm/commit/37aef15f19022568695f29f763059b183a7d4643)
- Fix: change cdnUuid export type from boolean to string [`506e2e7`](https://github.com/rive-app/rive-wasm/commit/506e2e774c9d21a46d1baaf01b677df049893d06)
- add support for rendering static scene [`9f527b2`](https://github.com/rive-app/rive-wasm/commit/9f527b28a4372510e51759f4b6c9ce94ad8b25e3)

## [2.7.0](https://github.com/rive-app/rive-wasm/compare/2.6.1...2.7.0) - 2023-10-26

### Commits

- chore: tag 2.7.0 [`6f053d9`](https://github.com/rive-app/rive-wasm/commit/6f053d916be27987f669761ab6a1790521c6fa14)
- Outofbandcache [`0bef370`](https://github.com/rive-app/rive-wasm/commit/0bef37078b8f669da33abab0b15cbb899aa7ec30)
- Fix for FollowPathConstraint position at distance multiples of 100% [`2fef572`](https://github.com/rive-app/rive-wasm/commit/2fef572a5620021c4a997cea634a5688863cb54b)
- Apply NestedInput initial values [`61ed529`](https://github.com/rive-app/rive-wasm/commit/61ed529a415b385102e27fdf28ae4c535362402b)
- feat: add neostream events sample [`5047460`](https://github.com/rive-app/rive-wasm/commit/504746034be96841914365286b6b754f833af5ff)
- Elastic easing [`4afb492`](https://github.com/rive-app/rive-wasm/commit/4afb49268a4b50d9b3e22ee9a5d86bc50c310991)
- Add options to build with rtti and exceptions [`d9ca38d`](https://github.com/rive-app/rive-wasm/commit/d9ca38d3a9b40e7e62a6d28ff5f8a7469f37b7df)
- Fix clang format error [`0de34e9`](https://github.com/rive-app/rive-wasm/commit/0de34e92b53a75cae0e69420f59f9b5286719036)
- fix version merge conflict [`694e8c3`](https://github.com/rive-app/rive-wasm/commit/694e8c3e738ef7fbbd4d107a520d8ac6049baec6)
- merge conflicts... [`3046c92`](https://github.com/rive-app/rive-wasm/commit/3046c92d4b30b9f2f93be129d1b2d7664a2b97b3)
- add isCollapsed validation on nested artboard advance method [`4b44437`](https://github.com/rive-app/rive-wasm/commit/4b44437edebebeca2b4505fa90b8e463a6fefa8a)
- Fixed clang check. [`9bc2f99`](https://github.com/rive-app/rive-wasm/commit/9bc2f9924ce96ef9e2e58dafd5a0f3992cf53c60)

## [2.6.1](https://github.com/rive-app/rive-wasm/compare/2.6.0...2.6.1) - 2023-10-19

### Commits

- chore: tag 2.6.1 [`e137799`](https://github.com/rive-app/rive-wasm/commit/e137799ca55a56f55cd07f356a6f65d17f1ee040)
- Add a canvas-lite and canvas-advanced-lite package for the web runtime [`f5da1b4`](https://github.com/rive-app/rive-wasm/commit/f5da1b495e1bcf0f514dcec81dc600fd638b04d9)
- Show NestedInputs in the Inputs panel of the parent artboard [`67fb4b5`](https://github.com/rive-app/rive-wasm/commit/67fb4b51a81261713c55766bfad8b0e81a943217)
- Move vello [`e3ed3fc`](https://github.com/rive-app/rive-wasm/commit/e3ed3fcb57a10398d49f3e61175a5d81a6d667c3)
- Added by-name instantiation. [`fd7c440`](https://github.com/rive-app/rive-wasm/commit/fd7c440b4f89a5ff30a6584e79445dcb69517fff)
- add ability to attach callbacks when resolving file asset listeners [`575845a`](https://github.com/rive-app/rive-wasm/commit/575845a5156bfd06443ea2c7e00238fb3a172ce5)
- patch up division by zero issue on normalizing Length [`9f516f2`](https://github.com/rive-app/rive-wasm/commit/9f516f28f3dfdf6475b290140a341e16e042f4a7)
- Android Out of Band Assets [`0dbf437`](https://github.com/rive-app/rive-wasm/commit/0dbf437cda25ce664c2aee201b56df64da259ee6)
- Removed single-threaded counter. [`aa6b968`](https://github.com/rive-app/rive-wasm/commit/aa6b9688a57549b705188fd1ae21436fbb87daa5)
- Removed Cargo workspace dependencies. [`d37449a`](https://github.com/rive-app/rive-wasm/commit/d37449a7bcedc8b676a34762d5e538a5ef068f5a)
- Fission the CG and Skia renderers [`4911796`](https://github.com/rive-app/rive-wasm/commit/49117961953fd19c209a291794b526d1332d63a5)
- Nested Inputs [`012c8dc`](https://github.com/rive-app/rive-wasm/commit/012c8dc353303c8eac2d02b384675190214859b9)
- Add support to Listeners for events from nested artboards [`7c83e01`](https://github.com/rive-app/rive-wasm/commit/7c83e019a7453006b004389f46b3ea8628263103)
- Added a Rust runtime. [`ed539e8`](https://github.com/rive-app/rive-wasm/commit/ed539e888621040ca5458dcb4b6cf632e9e12d2e)

## [2.6.0](https://github.com/rive-app/rive-wasm/compare/2.5.0...2.6.0) - 2023-10-10

### Commits

- chore: tag 2.6.0 [`a884bca`](https://github.com/rive-app/rive-wasm/commit/a884bca3bc3bd817c03aa0fbc80589f7752a2cac)
- feat: add count and query APIs for events and text runs at the Artboard level, and expose in WASM [`9d6316f`](https://github.com/rive-app/rive-wasm/commit/9d6316f15832fa5ab7ba8ff0200ee61895556c2e)

## [2.5.0](https://github.com/rive-app/rive-wasm/compare/2.4.4...2.5.0) - 2023-10-06

### Fixed

- separate animation and state machines initialization [`#4983`](https://github.com/rive-app/rive-wasm/issues/4983)

### Commits

- chore: tag 2.5.0 [`4a014ba`](https://github.com/rive-app/rive-wasm/commit/4a014bacbbfd5f854579608e05cbeede2d412e43)
- Add out of band loading to rive-wasm [`0eaf42d`](https://github.com/rive-app/rive-wasm/commit/0eaf42d69bd986225251f51a78052a4526cad9bd)

## [2.4.4](https://github.com/rive-app/rive-wasm/compare/2.4.3...2.4.4) - 2023-10-03

### Fixed

- 6041 follow path with 0 opacity [`#6041`](https://github.com/rive-app/rive-wasm/issues/6041)

### Commits

- chore: tag 2.4.4 [`8eee059`](https://github.com/rive-app/rive-wasm/commit/8eee059a79e7c5ce1010907970e6844c98383614)
- Add a math::round_up_to_multiple_of&lt;N&gt;() utility [`a210381`](https://github.com/rive-app/rive-wasm/commit/a210381dc854a6477694c8c5d4072efc6cb578e9)
- Clamping color stops. [`eb0e47e`](https://github.com/rive-app/rive-wasm/commit/eb0e47efe83044227613b145cf454f45a8e61268)
- Add a WebGPU mode that uses EXT_shader_pixel_local_storage [`f942f41`](https://github.com/rive-app/rive-wasm/commit/f942f418e89dfea2440736f37c620cccbfefea12)
- update runtime with file asset cdn information [`553ce90`](https://github.com/rive-app/rive-wasm/commit/553ce90e902c990617a7a8279de4f087e71246be)
- Add volume level support and clean up the music player project [`da5a497`](https://github.com/rive-app/rive-wasm/commit/da5a49797d0541771c7f0033bd1547596fc677db)

## [2.4.3](https://github.com/rive-app/rive-wasm/compare/2.4.2...2.4.3) - 2023-09-20

### Commits

- chore: tag 2.4.3 [`136c105`](https://github.com/rive-app/rive-wasm/commit/136c105d8d60a7103f576d5ee464865b073444cf)
- patch: add URL sanitization on open URL events [`c4accb9`](https://github.com/rive-app/rive-wasm/commit/c4accb9657372d1826c051043318ad1d73c0cf00)

## [2.4.2](https://github.com/rive-app/rive-wasm/compare/2.4.1...2.4.2) - 2023-09-19

### Commits

- chore: tag 2.4.2 [`a5aa9f4`](https://github.com/rive-app/rive-wasm/commit/a5aa9f4e9f9cd094de3e09722dacb9b56b29e539)
- Fix issue with timeline events on first frame [`127a7d4`](https://github.com/rive-app/rive-wasm/commit/127a7d49841d3798c8c22eff3f214d40e5250a58)

## [2.4.1](https://github.com/rive-app/rive-wasm/compare/2.4.0...2.4.1) - 2023-09-18

### Commits

- chore: tag 2.4.1 [`e6c9e8e`](https://github.com/rive-app/rive-wasm/commit/e6c9e8ef2b940137f47a8f283d2cb24f73347185)
- patch: specifically add changelog at project root level before releaseit commits [`b62d01e`](https://github.com/rive-app/rive-wasm/commit/b62d01e5993ab23dff945959b2e76cf6821f8732)
- Event fixes [`5284de1`](https://github.com/rive-app/rive-wasm/commit/5284de1237cf0dfbdc58c0309a2f78d2f92c48d6)
- Bump the iOS minimum version to 13 on native builds [`524177f`](https://github.com/rive-app/rive-wasm/commit/524177f70df43c9b38a13b369b28bf3e22ae4218)

## [2.4.0](https://github.com/rive-app/rive-wasm/compare/2.3.1...2.4.0) - 2023-09-12

### Fixed

- Read passed any empty runs when iterating glyphs. [`#5973`](https://github.com/rive-app/rive/issues/5973)

### Commits

- chore: tag 2.4.0 [`68b6d7d`](https://github.com/rive-app/rive-wasm/commit/68b6d7d1442699fee8cd107c50d9dd453255b8eb)
- feature: Add high-level API support for manually subscribing to Rive Events [`3479035`](https://github.com/rive-app/rive-wasm/commit/3479035b161a494b8e55e24cd3ce415e2d8ae7a9)
- add artboards shapes to updates when RenderOpacity has dirt [`28d4378`](https://github.com/rive-app/rive-wasm/commit/28d437832a344c366dbf838be1a28bf4aa1fb74a)
- Don't apply id keyframes when mix value is 0 [`a5f3094`](https://github.com/rive-app/rive-wasm/commit/a5f30946b18fbf6df9ccb24127b552bbcb785480)
- Timeline Events for runtime [`019d8a7`](https://github.com/rive-app/rive-wasm/commit/019d8a7368db6adbabf46a48bbaa71855be49971)

## [2.3.1](https://github.com/rive-app/rive-wasm/compare/2.3.0...2.3.1) - 2023-09-06

### Commits

- chore: tag 2.3.1 [`4e6e933`](https://github.com/rive-app/rive-wasm/commit/4e6e933c398fb646b2eadceca6bac82a2cd1d810)
- Fix a regression in WASM image meshes [`e909f91`](https://github.com/rive-app/rive-wasm/commit/e909f91b410968aff02df157b95f69c3a3c8a180)

## [2.3.0](https://github.com/rive-app/rive-wasm/compare/2.2.2...2.3.0) - 2023-09-01

### Commits

- chore: tag 2.3.0 [`541fd78`](https://github.com/rive-app/rive-wasm/commit/541fd7805d06fd637da1568b32c8dcf9a0a13f8d)
- Fix keepGoing when a work area is used. [`9eb468b`](https://github.com/rive-app/rive-wasm/commit/9eb468b72791b744e560613e78abf946f2cb8b70)
- Make Mat2D constructors constexpr [`d655bb8`](https://github.com/rive-app/rive-wasm/commit/d655bb8602b7ccae0259c0387770d0dcd922d81d)
- Fixed runtime to compile with gcc. [`5ce034d`](https://github.com/rive-app/rive-wasm/commit/5ce034d7a458d1cdc67ca7030790017f86ac8f1b)
- Allow setting text to completely empty. [`28fe4b9`](https://github.com/rive-app/rive-wasm/commit/28fe4b9856a974137743f743f45a66448fd06b59)
- Make RenderBuffer mappable [`9ae1356`](https://github.com/rive-app/rive-wasm/commit/9ae13560779f08698c8548ce01bcb93e463cad4a)
- Add a macro to create bitsets from enums [`282ba71`](https://github.com/rive-app/rive-wasm/commit/282ba715dec31bea36eb8f492e44070871eebc17)
- Add some joystick flag tests. [`56a6d85`](https://github.com/rive-app/rive-wasm/commit/56a6d8512655a7372ffea9e5c3b739d0acd6d57f)
- Delete the copy constructor from Mat2D [`ed0b0d9`](https://github.com/rive-app/rive-wasm/commit/ed0b0d90a555932f9175afc624ceec709ca63082)

## [2.2.2](https://github.com/rive-app/rive-wasm/compare/2.2.1...2.2.2) - 2023-08-26

### Commits

- chore: tag 2.2.2 [`766038d`](https://github.com/rive-app/rive-wasm/commit/766038d5e718535ce5b7ac4a4b0afc777ceabe40)
- Treat all Constraints and ClippingShapes differently than children when propagating collapse [`499bcae`](https://github.com/rive-app/rive-wasm/commit/499bcae1d9b155da928c984ea095443eedbf067d)

## [2.2.1](https://github.com/rive-app/rive-wasm/compare/2.2.0...2.2.1) - 2023-08-25

### Commits

- chore: tag 2.2.1 [`a9100e2`](https://github.com/rive-app/rive-wasm/commit/a9100e2dcb9c9ad48f24eff7b29d01e23a06137f)
- Improve collapse propagation for solo. [`d02fb10`](https://github.com/rive-app/rive-wasm/commit/d02fb1082251b0132632b75517154a0b87faa632)
- early out of advance if we are not going to keep goign [`8db282a`](https://github.com/rive-app/rive-wasm/commit/8db282aa62a45b2052956c14f75ae2d0baaa8aad)
- Don't collapse child constraints of Solos [`91000a1`](https://github.com/rive-app/rive-wasm/commit/91000a1e76c5bda347565717e112cdba823fda1f)
- patch: fix the version for emsdk download [`741e252`](https://github.com/rive-app/rive-wasm/commit/741e25285314c702f05a0e155b34e481a0d25199)
- Fix follow path contention with MetricsPath [`22994d1`](https://github.com/rive-app/rive-wasm/commit/22994d1e8430de1f3c27f44c91cf79c80015982a)
- Events API for WASM [`d93b18a`](https://github.com/rive-app/rive-wasm/commit/d93b18ab1c2cf571d251ff3e4971c9cb978e09c0)
- Choose events to fire on State and Transition start/end. [`079f744`](https://github.com/rive-app/rive-wasm/commit/079f74462b69bdd3f1029c7cf1b2fa2c371cddc3)
- Added a Vello back-end with a custom winit viewer. [`71ee3d0`](https://github.com/rive-app/rive-wasm/commit/71ee3d0fd9218d612c4b1a36ed06339f3d479e6f)

## [2.2.0](https://github.com/rive-app/rive-wasm/compare/2.1.5...2.2.0) - 2023-08-17

### Commits

- chore: tag 2.2.0 [`d1dc3f5`](https://github.com/rive-app/rive-wasm/commit/d1dc3f5f2e820d0e35c605e904ad95789e729d2c)
- feature: wrap renderer in a Proxy to expose Canvas2d context [`780e9a5`](https://github.com/rive-app/rive-wasm/commit/780e9a51ec4b11ffe972e69116d5f51a39618c4d)
- Implement drawImage() in PLS [`d47e6de`](https://github.com/rive-app/rive-wasm/commit/d47e6de06904df35ad2beb90e1b836bdaf95cd89)
- Event triggering [`2d34998`](https://github.com/rive-app/rive-wasm/commit/2d34998c312cc052688cabfa94e3557db9ee0b3c)

## [2.1.5](https://github.com/rive-app/rive-wasm/compare/2.1.4...2.1.5) - 2023-08-14

### Commits

- chore: tag 2.1.5 [`71a0361`](https://github.com/rive-app/rive-wasm/commit/71a0361cc95bafb43f8a930daadb56bd54e714c4)
- Fix issue with nested artboards not updating follow path constraints. [`3f09529`](https://github.com/rive-app/rive-wasm/commit/3f09529e0884d9ed66cee4e84ddeb57affa2a681)

## [2.1.4](https://github.com/rive-app/rive-wasm/compare/2.1.3...2.1.4) - 2023-08-11

### Commits

- chore: tag 2.1.4 [`7d56931`](https://github.com/rive-app/rive-wasm/commit/7d569311de4fa795f7a59ea674b57825962312f2)
- fix: move up one directory before release-it commits and pushes and tags [`bea14ed`](https://github.com/rive-app/rive-wasm/commit/bea14ed0cc8d5afdf6ac80fa8128e0662a7f087b)

## [2.1.3](https://github.com/rive-app/rive-wasm/compare/2.1.2...2.1.3) - 2023-08-10

### Commits

- chore: tag 2.1.3 [`da97468`](https://github.com/rive-app/rive-wasm/commit/da97468136a0f3ef523a48ac5dbfbd0526a56bbf)
- patch: provide a backup source to load WASM from in case unpkg goes down [`1e016e4`](https://github.com/rive-app/rive-wasm/commit/1e016e438f271a74c4f099e70d82fa175fb99490)
- Add rive::math::msb() [`98c7c90`](https://github.com/rive-app/rive-wasm/commit/98c7c903807a951b2e93a42111cbc8456416b78c)
- Add a Bitmap::detachBytes method [`a3576f4`](https://github.com/rive-app/rive-wasm/commit/a3576f4046b90ac04950547a92773dd48af23d9f)
- Letter spacing! [`1310202`](https://github.com/rive-app/rive-wasm/commit/131020261617ee4e4c57b16f0036d0f17deaccca)
- Run editor tests on hosted runner. [`4863d33`](https://github.com/rive-app/rive-wasm/commit/4863d33fc7c7884a837345a536abe9f9bd577395)

## [2.1.2](https://github.com/rive-app/rive-wasm/compare/2.1.1...2.1.2) - 2023-08-05

### Commits

- chore: tag 2.1.2 [`ec3d979`](https://github.com/rive-app/rive-wasm/commit/ec3d979b1fe2ab635aa07a7f04f3de3ec8222c56)
- fix leak in move operator= on SimpleArray [`f5fde28`](https://github.com/rive-app/rive-wasm/commit/f5fde28dc1b553e9683f1e2f24b354c82c605174)
- Make rive_decoders compile on Windows [`bad4e70`](https://github.com/rive-app/rive-wasm/commit/bad4e70461ea592291bdc6b00b3b7f5ce17e5851)

## [2.1.1](https://github.com/rive-app/rive-wasm/compare/2.1.0...2.1.1) - 2023-08-03

### Fixed

- Clipping and baseline [`#5732`](https://github.com/rive-app/rive-wasm/issues/5732)

### Commits

- chore: tag 2.1.1 [`e1fc83e`](https://github.com/rive-app/rive-wasm/commit/e1fc83e9ed3e6291ed4e52793f89c7972b11c647)
- Enable animation for Text Run style prop [`5602552`](https://github.com/rive-app/rive-wasm/commit/5602552cea4c319739594d38587982bda0dcd333)
- Lift tess decoders into a static lib [`88c6213`](https://github.com/rive-app/rive-wasm/commit/88c621336e03a06b119fd648573666b53d153a11)

## [2.1.0](https://github.com/rive-app/rive-wasm/compare/2.0.0...2.1.0) - 2023-07-31

### Commits

- chore: tag 2.1.0 [`24c3146`](https://github.com/rive-app/rive-wasm/commit/24c3146f12b812dad17c30399323a744bccfdc3b)
- Fix crash when no Follow path target specified [`da74f29`](https://github.com/rive-app/rive-wasm/commit/da74f29fef46c490a4410e3a83ece58eb4c41808)
- feature: Adding high-level API for querying a text run from an artboard [`98585ab`](https://github.com/rive-app/rive-wasm/commit/98585ab8b399b6c4998870e6e3325fe9c73aa754)
- Update text render styles when origin changes. [`7b51fa8`](https://github.com/rive-app/rive-wasm/commit/7b51fa82f4743249e1f4d501e88bdfbe60c990af)
- Text fixes [`b486eda`](https://github.com/rive-app/rive-wasm/commit/b486eda45df006f1b11b113b710703961ade59ce)
- Add originX and originY support to images [`cbd2840`](https://github.com/rive-app/rive-wasm/commit/cbd2840591b5680528a36a7befd1530050f02f61)
- Fix text alignment in cpp based runtimes [`1039cba`](https://github.com/rive-app/rive-wasm/commit/1039cbadf75416f1ef3dca36c484ca1b120f3291)
- Replace broken hero image on runtime READMEs [`f8d4ea8`](https://github.com/rive-app/rive-wasm/commit/f8d4ea84311b518dd87d972abb0f2f9061fdc206)
- Build with rive_text from Android Studio [`7e70479`](https://github.com/rive-app/rive-wasm/commit/7e70479d3e418de12c6dd8e994bb42b51786a543)
- update thumbnailer for text [`43ac9de`](https://github.com/rive-app/rive-wasm/commit/43ac9deab30ea2d4b0a4d66b28a841cf9bbe53c6)

## [2.0.0](https://github.com/rive-app/rive-wasm/compare/1.2.4...2.0.0) - 2023-07-26

### Commits

- chore: tag 2.0.0 [`93b51e9`](https://github.com/rive-app/rive-wasm/commit/93b51e9240ad650e651f7c2cdde51869c3ae856d)
- build wasm text! [`41a9102`](https://github.com/rive-app/rive-wasm/commit/41a9102e6d50bb66ec43281d265bef0ccfc7d41d)
- Adding run targeting to text value ranges! [`b9dbd47`](https://github.com/rive-app/rive-wasm/commit/b9dbd475406ebe2e32e21bdb2d9d91fd87d26988)
- Follow path distance support all values & fix scaling issue. [`2d699cf`](https://github.com/rive-app/rive-wasm/commit/2d699cfa8d216d16a0bb39ac584b15f3db12c56d)
- Rive Text for iOS and Android! [`d139aa1`](https://github.com/rive-app/rive-wasm/commit/d139aa18fb6f98b3435a1f750c855d2ccb2ba500)
- Fix small bugs caught by JC (and Alex). [`9eb46a4`](https://github.com/rive-app/rive-wasm/commit/9eb46a4b5a365543bcaa2ba2d4d51d34b08b2fde)

## [1.2.4](https://github.com/rive-app/rive-wasm/compare/1.2.3...1.2.4) - 2023-07-22

### Commits

- chore: tag 1.2.4 [`fbb6b46`](https://github.com/rive-app/rive-wasm/commit/fbb6b4667d27ab41303c9958d81693441d2b1421)
- Add dependencies folder to wasm gitignore [`245afe2`](https://github.com/rive-app/rive-wasm/commit/245afe288b7dd4bb3a9fe1f276cc1c87bd53729f)
- temporarily stripping text capability [`58ca638`](https://github.com/rive-app/rive-wasm/commit/58ca63861baf70da3809e17a6f44be297914448b)
- FollowPathConstraint to extend TransformSpaceConstraint [`3eb2072`](https://github.com/rive-app/rive-wasm/commit/3eb2072daeb0c31a026460887f6ab08b22230b82)
- Fix conflict. [`877a91f`](https://github.com/rive-app/rive-wasm/commit/877a91f30088dce89d82c0de5f78feeee308038d)
- merge conflicts... [`0c46ba0`](https://github.com/rive-app/rive-wasm/commit/0c46ba03a3c95104882827537cea74d7495cf87c)
- Don't use the '-g' buildoption in premake [`c14ddd4`](https://github.com/rive-app/rive-wasm/commit/c14ddd4277b3b01dd42373c3aad94dd9d0bd669f)
- Fixing modifier ranges not updating on the right frame. [`7273e1a`](https://github.com/rive-app/rive-wasm/commit/7273e1a67b1aaf0e599410ffe9aa3b7708d7dcfc)

## [1.2.3](https://github.com/rive-app/rive-wasm/compare/1.2.2...1.2.3) - 2023-07-19

### Commits

- chore: tag 1.2.3 [`b693cd0`](https://github.com/rive-app/rive-wasm/commit/b693cd0d73d1f648c3945ba60ba7b7d616ad1969)
- Deprecating 'unsubscribe' in favor of 'off' in JS API [`b9cb46a`](https://github.com/rive-app/rive-wasm/commit/b9cb46a6580f6f84457e9f8caf003851b9658dd7)

## [1.2.2](https://github.com/rive-app/rive-wasm/compare/1.2.1...1.2.2) - 2023-07-19

### Commits

- chore: tag 1.2.2 [`4240298`](https://github.com/rive-app/rive-wasm/commit/42402983157bf235eaef07e8f53f75bcc1434bda)
- Fix dependency order issues for Follow Path [`2e7add2`](https://github.com/rive-app/rive-wasm/commit/2e7add24620e75a167b45a6ee87539d2464ce028)
- Baseline Origin [`3116f9b`](https://github.com/rive-app/rive-wasm/commit/3116f9bde004250487dde9bb9cc3352454f03b75)
- Add option to quantize time to whole frames of framerate. [`a1394cf`](https://github.com/rive-app/rive-wasm/commit/a1394cf7b3cc36c1065b9d357f1805d9247ce271)
- Follow path should respect constrained component rotation if orient is off [`f9edab7`](https://github.com/rive-app/rive-wasm/commit/f9edab7fe9f4114d3e2131b64cab8fd9b299a487)
- feature: Add onAdvance hook into render loop to report advancing has occurred [`b55e640`](https://github.com/rive-app/rive-wasm/commit/b55e64003761c3ae2047a880a795df00c6d5c9eb)
- Code generator fixes alternative [`60f0a9f`](https://github.com/rive-app/rive-wasm/commit/60f0a9f4d933e4e81906c0525edc0dc0bfede64e)
- Adding target origin to transform constraint. [`0693364`](https://github.com/rive-app/rive-wasm/commit/0693364c6fcad544c97494ef36f43316c4074d08)
- Stop automatically pruning empty segments in RawPath [`7a97a03`](https://github.com/rive-app/rive-wasm/commit/7a97a0318c3105d48fbcd869af8de12b49bad56f)
- Line Height & Paragraph Spacing [`385b582`](https://github.com/rive-app/rive-wasm/commit/385b5822b1d17d9242b4011a88f43ead3276c177)
- Runtime modifiers [`9bb60e9`](https://github.com/rive-app/rive-wasm/commit/9bb60e900f3dcdcef0c8b6314fc3698a316a0c84)
- Get more compiling on MSVC [`17baa4e`](https://github.com/rive-app/rive-wasm/commit/17baa4ea396487ce35040763059cddc655e6a752)
- Swap propertyKeys between follow path and text core defs [`f9ff1c8`](https://github.com/rive-app/rive-wasm/commit/f9ff1c875b1eee3c362259c3f08507e2531cee9c)
- Fix conflicting core key ids and set follow path offset to default false [`52234f0`](https://github.com/rive-app/rive-wasm/commit/52234f0ae0585f494e937406e7a1dad15ddbaf2a)
- Follow Path Constraint (Editor & CPP Runtime) [`7813939`](https://github.com/rive-app/rive-wasm/commit/7813939f692a71ee772bb5e7f97702b51d675c85)
- Adding origin to text. [`11f11e8`](https://github.com/rive-app/rive-wasm/commit/11f11e8a2aca1d271bd0d32f4a176b8a2ac30325)
- Add CMake support for building Android and Catch2 Tests [`0d40a56`](https://github.com/rive-app/rive-wasm/commit/0d40a5656505996d1b190d9f0df87ecd15e73287)
- Increases the margin for the approx call to some of the wangs formula… [`c670345`](https://github.com/rive-app/rive-wasm/commit/c670345e7f76acf44a9f9ee8653abb1fe0eb61cb)
- Runtime ellipsis [`ef7dedf`](https://github.com/rive-app/rive-wasm/commit/ef7dedfee44bc24d5f252cb4e82e11f2b7c0d1e0)
- fix viewer build [`7d2b93d`](https://github.com/rive-app/rive-wasm/commit/7d2b93d80576611e296e570cfbea7597094e6e55)

## [1.2.1](https://github.com/rive-app/rive-wasm/compare/1.2.0...1.2.1) - 2023-06-26

### Commits

- chore: tag 1.2.1 [`22aafe2`](https://github.com/rive-app/rive-wasm/commit/22aafe275d86cbb64ccc0fb8a8c30303c21103d7)
- Feature options on Fonts [`48991fd`](https://github.com/rive-app/rive-wasm/commit/48991fdbd138af9b33944316e818644b05357332)
- docs: update contributing docs [`893b916`](https://github.com/rive-app/rive-wasm/commit/893b91669a4417d8bc3e986732b2cdefabb20300)
- update rive head [`257dc7c`](https://github.com/rive-app/rive-wasm/commit/257dc7ce8fc2e7c14aadbe2b3dc16bb972546513)
- Add rive head file [`9b01be1`](https://github.com/rive-app/rive-wasm/commit/9b01be19e171164d7fd268099d0a8d5da6ed3e01)

## [1.2.0](https://github.com/rive-app/rive-wasm/compare/1.1.10...1.2.0) - 2023-06-09

### Commits

- chore: tag 1.2.0 [`a64baf9`](https://github.com/rive-app/rive-wasm/commit/a64baf97947a69c488c88809ac89738f880f6bda)
- fix: set fetch depth to 0 to grab tags [`ed12c69`](https://github.com/rive-app/rive-wasm/commit/ed12c69e78b66b2c248806357d1c68b6eaccdc3c)
- Feature: Add drawImage API to CanvasRenderer on low-level runtime and fix types [`031424b`](https://github.com/rive-app/rive-wasm/commit/031424b57569af231590c6344683f7c08344b318)

## [1.1.10](https://github.com/rive-app/rive-wasm/compare/1.1.9...1.1.10) - 2023-06-07

### Commits

- chore: tag 1.1.10 [`4b8904b`](https://github.com/rive-app/rive-wasm/commit/4b8904b3d5f3b0610a8a10d0bf4476a5da449f81)
- fix for loop over animatables without changing typescript target [`f44df26`](https://github.com/rive-app/rive-wasm/commit/f44df2685bdca033dcbfd68a209466f13e9a7669)
- Make sure Animator.add() is iterating only on own properties [`9dd2826`](https://github.com/rive-app/rive-wasm/commit/9dd282639d106d8182c51ee10523ad8c7d5f4ddc)
- add back old changelog, add deprecated note [`b0a15a3`](https://github.com/rive-app/rive-wasm/commit/b0a15a36aaa624ff8535787adb5228c109d2ef94)
- docs: add changelog step into release-it workflow [`f1ef10e`](https://github.com/rive-app/rive-wasm/commit/f1ef10eeb31e4c50eea29b3372d14b5348e400c5)

## [1.1.9](https://github.com/rive-app/rive-wasm/compare/1.1.8...1.1.9) - 2023-05-24

### Commits

- chore: tag 1.1.9 [`7d50049`](https://github.com/rive-app/rive-wasm/commit/7d50049924a2a28e209174e859a2d069285a5022)
- patch: bump cpp for further joystick support [`275c81a`](https://github.com/rive-app/rive-wasm/commit/275c81ad46c23918777a747492eb9eced1a23684)

## [1.1.8](https://github.com/rive-app/rive-wasm/compare/1.1.7...1.1.8) - 2023-05-22

### Commits

- chore: tag 1.1.8 [`d19e74f`](https://github.com/rive-app/rive-wasm/commit/d19e74f2250a290ca67148afac7a99433a585522)
- chore: bump rive-cpp for latest joystick updates [`72cf5e4`](https://github.com/rive-app/rive-wasm/commit/72cf5e47cd76f09bbd2b1dd47f95a21ae94ff9c1)

## [1.1.7](https://github.com/rive-app/rive-wasm/compare/1.1.6...1.1.7) - 2023-05-18

### Commits

- chore: tag 1.1.7 [`368bec0`](https://github.com/rive-app/rive-wasm/commit/368bec0ae2888392daf17c642852945a261f8646)
- feature: bump cpp to support joysticks [`5a58786`](https://github.com/rive-app/rive-wasm/commit/5a58786499b42638a42db73bfb680b16111e7f96)

## [1.1.6](https://github.com/rive-app/rive-wasm/compare/1.1.5...1.1.6) - 2023-05-12

### Commits

- chore: tag 1.1.6 [`14477c2`](https://github.com/rive-app/rive-wasm/commit/14477c2d003362f24cb90a68a705d0783137a0f6)
- fix: bump cpp to fix flicker issue [`cd31861`](https://github.com/rive-app/rive-wasm/commit/cd318617f8156d504b2997086bb5cff24ea5ae37)
- Create add_to_project.yml [`16a6fb6`](https://github.com/rive-app/rive-wasm/commit/16a6fb64e06bd2c5e38a96496124aa4d102b78da)

## [1.1.5](https://github.com/rive-app/rive-wasm/compare/1.1.4...1.1.5) - 2023-05-02

### Commits

- chore: tag 1.1.5 [`adb5f90`](https://github.com/rive-app/rive-wasm/commit/adb5f909f02d41aba7adf764b05d6dc4dac6b3a9)
- add test to detect listeners cleaned up on canvas after stop() is called [`ecb71f5`](https://github.com/rive-app/rive-wasm/commit/ecb71f551b2e4894e857d06884001eb14887eff1)
- add tests [`b62ddf0`](https://github.com/rive-app/rive-wasm/commit/b62ddf0c9de752f793b8c31fb5d1539efd764777)
- Ensure Rive listeners are setup when the play() method is called and torn down on stop() [`5cec907`](https://github.com/rive-app/rive-wasm/commit/5cec907e21bbc9c0aef4e8f43e98566299ca8d37)

## [1.1.4](https://github.com/rive-app/rive-wasm/compare/1.1.3...1.1.4) - 2023-04-20

### Commits

- chore: tag 1.1.4 [`43f9186`](https://github.com/rive-app/rive-wasm/commit/43f9186e73c42364f0198c16e895662d25b2cfd2)
- feature: Add high-level check if a state machine has listeners [`8f3ffa4`](https://github.com/rive-app/rive-wasm/commit/8f3ffa4f9de1dbb027d327919cb50bf3380c2fcd)
- feature: Add Rive parameter to disable listeners from being setup on the canvas [`3b2419e`](https://github.com/rive-app/rive-wasm/commit/3b2419ea3d96cc4865a4e01ec1ec8e31376f15f0)

## [1.1.3](https://github.com/rive-app/rive-wasm/compare/1.1.2...1.1.3) - 2023-04-14

### Commits

- chore: tag 1.1.3 [`6275ebe`](https://github.com/rive-app/rive-wasm/commit/6275ebe14500f9c82837170f44314193763b0f34)
- fix: bump cpp for path composer patch [`6f8f435`](https://github.com/rive-app/rive-wasm/commit/6f8f435617516f4c1e519f4433ea72b2a47f6bcc)

## [1.1.2](https://github.com/rive-app/rive-wasm/compare/1.1.1...1.1.2) - 2023-04-12

### Commits

- chore: tag 1.1.2 [`9ca2629`](https://github.com/rive-app/rive-wasm/commit/9ca2629b4104c8dd19064a9f3941403cbdf59447)
- fix: bump cpp for solo fix [`413c38e`](https://github.com/rive-app/rive-wasm/commit/413c38ea8a2340eecac40dade2c60cf242978612)

## [1.1.1](https://github.com/rive-app/rive-wasm/compare/1.1.0...1.1.1) - 2023-04-06

### Commits

- chore: tag 1.1.1 [`1df4d3d`](https://github.com/rive-app/rive-wasm/commit/1df4d3d974c3abb1ec34cb686972fb200452420e)
- patch: bump cpp dependency for direct blend state changes [`7a0e13f`](https://github.com/rive-app/rive-wasm/commit/7a0e13ffbf386d20cc5fa78389994195e7b3a4f0)
