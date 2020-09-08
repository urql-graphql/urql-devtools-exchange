#!/bin/bash
CWD=`dirname $0`
TMP="/tmp/exchange-urql-example"

rm -r $CWD/../example

# Pull urql example and put in example folder
mkdir $TMP
curl -SL https://github.com/FormidableLabs/urql/archive/main.zip > $TMP/main.zip
unzip $TMP/main.zip "urql-main/packages/react-urql/examples/1-getting-started/*" $TMP
mv urql-main/packages/react-urql/examples/1-getting-started $CWD/../example
rm -r $TMP

# Add link for exchange
cd $CWD/../example
sed -i -e 's|^{$|{\
  "alias": {\
    "@urql/devtools": "../"\
  },|' package.json
yarn
