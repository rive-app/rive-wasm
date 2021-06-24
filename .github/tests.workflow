name: Run Tests
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Install modules
      run: cd js && npm install
    - name: Run tests
      run: cd js && npm test