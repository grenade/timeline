import { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Table from 'react-bootstrap/Table';
import { dateDiff } from './utils';

const isoDatePattern = new RegExp('^(199[0-9]|20[0-2][0-9])-[01][0-9]-[0-3][0-9]$');
const dateFormat = (d) => (
  (isoDatePattern.test(d))
    ? new Intl.DateTimeFormat('default', { year: 'numeric', month: 'long' }).format(new Date(d)).toLowerCase()
    : d
);
const timespanFormat = (from, to) => (
  (from === to || !to)
    ? dateFormat(from)
    : `${dateFormat(from)} - ${dateFormat(to)}`
);
const flag = (countryCode) => (
  String.fromCodePoint(...countryCode
    .toUpperCase()
    .split('')
    .map(char =>  127397 + char.charCodeAt()))
);


const App = () => {
  const [timeline, setTimeline] = useState(undefined);
  useEffect(() => {
    fetch('https://api.github.com/gists/0cb19dd2aaa3365c6e47e1fc478529f8')
      .then(response => response.json())
      .then(gist => {
        fetch(`https://gist.githubusercontent.com/grenade/c80d872e98b8b38401c92cc468b91003/raw/timeline.json`)
          .then(response => response.json())
          .then((timeline) => {
            setTimeline(
              timeline
                .filter((x) => ['home', 'work'].includes(x.type) && ((x.to === 'present') || (dateDiff(new Date(x.from), new Date(x.to), 'day') > 31)))
                .sort((a, b) => (a.from > b.from) ? 1 : (a.from < b.from) ? -1 : 0)
                .reduce((a, x) => {
                  if ((!!a.length) && (a[a.length - 1].town === x.town)) {
                    const l = a.pop();
                    return [...a, ...[{
                      ...x,
                      from: l.from,
                    }]];
                  } else {
                    return [...a, ...[x]];
                  }
                }, [])
                .map((x) => ({
                  ...x,
                  evidence: Object.keys(gist.files).filter(f => {
                    const d = f.split('-')[0];
                    return ((d !== '00') && (d > x.from.replace('-', '')) && (d < x.to.replace('-', '')))
                  })
                }))
            );
          })
          .catch((error) => {
            console.error(error);
          });
      });
  }, []);
  return (
    <Container>
      <h1>rob thijssen</h1>
      <h2>residency timeline</h2>
      <h3>1992 ~ 2022</h3>
      {
        (!!timeline)
          ? (
              <Table>
                <thead>
                  <tr>
                    <th>date</th>
                    <th>location</th>
                    <th>evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    timeline.map((x, xI) => (
                      <tr key={xI}>
                        <td>
                          {timespanFormat(x.from, x.to)} <sup className="text-muted">{dateDiff(new Date(x.from), new Date((x.to === 'present') ? new Date() : x.to), 2)}</sup>
                        </td>
                        <td>
                          {`${flag(x.country.code)} ${x.town.toLowerCase()}, ${x.country.name.toLowerCase().replace('united kingdom', 'uk')}`}
                        </td>
                        <td>
                          {
                            (!!x.evidence && !!x.evidence.length)
                              ? (
                                  <ul>
                                    {
                                      x.evidence.map((e, eI) => (
                                        <li key={eI}>
                                          <a href={`https://gist.github.com/grenade/0cb19dd2aaa3365c6e47e1fc478529f8/raw/${e}`}>{e}</a>
                                        </li>
                                      ))
                                    }
                                  </ul>
                                )
                              : null
                          }
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </Table>
            )
          : null
      }
    </Container>
  )
};

export default App;
