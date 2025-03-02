import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';
import { ArgumentParser } from 'argparse';

// 获取当前文件的目录
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log(`
作者: 柚木梨酱
介绍: 一个能够将hae插件规则转换为yakit规则配置的脚本
github: https://github.com/youmulijiang
知识大陆: 地图大师的挖洞军火库
`);

// 配置命令行参数
const parser = new ArgumentParser({
  description: '将hae规则转换为yakit规则配置',
});
parser.add_argument('-f', '--file', { help: '指定hae的配置文件', required: true });
parser.add_argument('-o', '--output', { help: '保存指定目录', default: null });
const args = parser.parse_args();

/**
 * 将 YAML 文件转换为 JSON 格式
 * @param {string} filePath - YAML 文件路径
 * @param {string} savePath - 保存 JSON 文件的路径
 * @returns {Promise<string>} - 返回生成的 JSON 字符串
 */
async function yamlToJson(filePath, savePath) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const result = yaml.load(fileContent);
    const allDictList = [];
    let index = 0;

    const groupList = result.rules;
    for (const ruleDict of groupList) {
      const ruleList = ruleDict.rule;
      const ruleGroup = ruleDict.group;

      for (const rule of ruleList) {
        index += 1;
        const name = rule.name;

        // 提取正则表达式
        const regex = rule.f_regex || rule.s_regex || rule.regex || '';

        const { loaded, scope, color } = rule;
        const yakitDict = bpRuleToYakitRule(ruleGroup, name, regex, loaded, scope, color, index);

        if (Object.keys(yakitDict).length !== 0) {
          allDictList.push(yakitDict);
        }
      }
    }

    const yakitJson = JSON.stringify(allDictList, null, 2);

    if (savePath) {
      await fs.writeFile(savePath, yakitJson, 'utf8');
      }

    return yakitJson;
  } catch (error) {
    console.error('转换失败:', error);
    throw error;
  }
}

/**
 * 将 hae 规则转换为 yakit 规则
 * @param {string} ruleGroup - 规则组
 * @param {string} name - 规则名称
 * @param {string} rule - 正则表达式
 * @param {boolean} loaded - 是否启用
 * @param {string} scope - 作用域
 * @param {string} color - 颜色
 * @param {number} index - 索引
 * @returns {object} - 返回 yakit 规则对象
 */
function bpRuleToYakitRule(ruleGroup, name, rule, loaded, scope, color, index) {
  if (!loaded) return {};

  const yakitDict = {
    ExtraTag: [`${ruleGroup}/${name}`],
    VerboseName: name,
    Rule: rule,
    NoReplace: true,
    Color: color,
    Index: index,
  };

  // 设置作用域
  if (scope.endsWith('body')) {
    yakitDict.EnableForBody = true;
  } else if (scope.endsWith('header')) {
    yakitDict.EnableForHeader = true;
  } else {
    yakitDict.EnableForBody = true;
    yakitDict.EnableForHeader = true;
  }

  // 设置请求/响应范围
  if (scope.startsWith('request')) {
    yakitDict.EnableForRequest = true;
  } else if (scope.startsWith('response')) {
    yakitDict.EnableForResponse = true;
  } else {
    yakitDict.EnableForRequest = true;
    yakitDict.EnableForResponse = true;
  }

  return yakitDict;
}

// 主函数
async function main() {
  try {
    if (args.file && args.output) {
      const jsonResult = await yamlToJson(args.file, args.output);
      console.log('转换成功:', jsonResult);
    } else {
      console.log('请提供hae配置文件和输出路径');
    }
  } catch (error) {
    console.error('发生错误:', error);
  }
}

// 执行主函数
main();